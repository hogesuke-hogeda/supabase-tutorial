#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/supabase-utils.sh"

PROJECT_DIR="${PROJECT_DIR:-}"

LOCAL_HOST="127.0.0.1"
LOCAL_API_PORT="${SUPABASE_LOCAL_API_PORT:-54321}"
LOCAL_DB_PORT="${SUPABASE_LOCAL_DB_PORT:-54322}"

TARGET_HOST="${SUPABASE_HOST_GATEWAY:-}"
TARGET_API_PORT="${SUPABASE_API_PORT:-54321}"
TARGET_DB_PORT="${SUPABASE_DB_PORT:-54322}"

DOCKER_NETWORK="${DOCKER_NETWORK:-}"
STACK_SENTINEL_CONTAINER="${SUPABASE_STACK_CONTAINER:-supabase_kong_supabase-tutorial}"
AUTH_CONTAINER_NAME="${SUPABASE_AUTH_CONTAINER:-supabase_auth_supabase-tutorial}"
TEMPLATE_SOURCE_DIR="${SUPABASE_TEMPLATE_SOURCE_DIR:-${PROJECT_DIR}/supabase/templates}"
TEMPLATE_ROOT_IN_CONTAINER="${SUPABASE_TEMPLATE_ROOT_IN_CONTAINER:-/home/kong/templates/email}"

usage() {
  cat <<'EOF'
Usage:
  /bin/bash bin/start-supabase.sh

Starts the local Supabase stack from inside the devcontainer when it is not
already running. If the stack is already up, this script exits successfully
without changing anything.

Environment:
  PROJECT_DIR               Required. Supabase project root in the devcontainer
                            (provided by devcontainer.json)
  DOCKER_NETWORK            Required. Docker network for the local stack
                            (provided by devcontainer.json)
  SUPABASE_HOST_GATEWAY     Optional override for the Docker host gateway IP
                            (default: resolved from `ip route`)
  SUPABASE_API_PORT         Optional override for the target API port
                            (default: 54321)
  SUPABASE_DB_PORT          Optional override for the target DB port
                            (default: 54322)
  SUPABASE_LOCAL_API_PORT   Optional override for the local API proxy port
                            (default: 54321)
  SUPABASE_LOCAL_DB_PORT    Optional override for the local DB proxy port
                            (default: 54322)
  SUPABASE_STACK_CONTAINER  Optional override for the sentinel container name
                            (default: supabase_kong_supabase-tutorial)
  SUPABASE_AUTH_CONTAINER   Optional override for the auth container name used
                            for template cache reload on cold start
                            (default: supabase_auth_supabase-tutorial)
  SUPABASE_TEMPLATE_SOURCE_DIR Optional override for local template dir
                            (default: $PROJECT_DIR/supabase/templates)
  SUPABASE_TEMPLATE_ROOT_IN_CONTAINER Optional override for container template root
                            (default: /home/kong/templates/email)
EOF
}

is_stack_running() {
  docker ps --format '{{.Names}}' | grep -qx "$STACK_SENTINEL_CONTAINER"
}

is_local_db_reachable() {
  is_supabase_local_db_reachable "$LOCAL_HOST" "$LOCAL_DB_PORT"
}

is_local_api_reachable() {
  is_supabase_local_api_reachable "$LOCAL_HOST" "$LOCAL_API_PORT"
}

is_local_listener_present() {
  local port="$1"
  ss -ltnH | awk -v port="${LOCAL_HOST}:${port}" '$4 == port { found=1 } END { exit(found ? 0 : 1) }'
}

start_proxy() {
  local listen_port="$1"
  local target_host="$2"
  local target_port="$3"
  local log_file="/tmp/start-supabase-proxy-${listen_port}.log"
  local proxy_pid

  if is_local_listener_present "$listen_port"; then
    return
  fi

  socat \
    "TCP-LISTEN:${listen_port},bind=${LOCAL_HOST},reuseaddr,fork" \
    "TCP:${target_host}:${target_port},connect-timeout=1,retry=240,interval=0.25" \
    >"$log_file" 2>&1 &
  proxy_pid=$!

  sleep 1

  if ! kill -0 "$proxy_pid" >/dev/null 2>&1; then
    die "failed to start local proxy on ${LOCAL_HOST}:${listen_port}. See ${log_file}."
  fi
}

wait_for_local_db() {
  local attempt
  for attempt in $(seq 1 60); do
    if is_local_db_reachable; then
      return
    fi
    sleep 1
  done

  die "local DB proxy did not become reachable on ${LOCAL_HOST}:${LOCAL_DB_PORT}"
}

wait_for_local_api() {
  local attempt
  for attempt in $(seq 1 60); do
    if is_local_api_reachable; then
      return
    fi
    sleep 1
  done

  die "local API proxy did not become reachable on ${LOCAL_HOST}:${LOCAL_API_PORT}"
}

sync_local_email_templates() {
  local template_count

  if [ ! -d "$TEMPLATE_SOURCE_DIR" ]; then
    die "template source directory does not exist: ${TEMPLATE_SOURCE_DIR}"
  fi

  template_count="$(find "$TEMPLATE_SOURCE_DIR" -maxdepth 1 -type f -name '*.html' | wc -l)"
  if [ "$template_count" -eq 0 ]; then
    die "no HTML email templates found in ${TEMPLATE_SOURCE_DIR}"
  fi

  # Supabase local auth resolves `content_path` templates through Kong's
  # `/email/...` endpoint, which serves files from `/home/kong/templates/email`.
  # Copy local templates there so custom confirmation links are available.
  find "$TEMPLATE_SOURCE_DIR" -maxdepth 1 -type f -name '*.html' | while IFS= read -r template_path; do
    local template_name
    local container_dir

    template_name="$(basename "$template_path")"
    container_dir="${TEMPLATE_ROOT_IN_CONTAINER}/${template_name}"

    docker exec "$STACK_SENTINEL_CONTAINER" mkdir -p "$container_dir"
    docker cp "$template_path" "${STACK_SENTINEL_CONTAINER}:${container_dir}/index.html"
  done
}

wait_for_auth_container() {
  local attempt
  local status

  for attempt in $(seq 1 60); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$AUTH_CONTAINER_NAME" 2>/dev/null || true)"
    if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
      return
    fi
    sleep 1
  done

  die "auth container did not become healthy: ${AUTH_CONTAINER_NAME}"
}

reload_auth_template_cache() {
  # On a cold start, auth may try to fetch the custom email template before
  # Kong's template files are in place. Restart auth after syncing so it
  # rebuilds the template cache against the populated `/email/...` endpoint.
  docker restart "$AUTH_CONTAINER_NAME" >/dev/null
  wait_for_auth_container
}

main() {
  local target_host

  case "${1:-}" in
    -h|--help|help)
      usage
      exit 0
      ;;
  esac

  require_command curl
  require_command docker
  require_command ip
  require_command pg_isready
  require_command socat

  if [ -z "$PROJECT_DIR" ]; then
    die "PROJECT_DIR is not set. Run this script from the devcontainer."
  fi

  if [ -z "$DOCKER_NETWORK" ]; then
    die "DOCKER_NETWORK is not set. Run this script from the devcontainer."
  fi

  target_host="$(resolve_supabase_target_host "$TARGET_HOST")"
  if [ -z "$target_host" ]; then
    die "cannot resolve Docker host gateway IP."
  fi

  start_proxy "$LOCAL_API_PORT" "$target_host" "$TARGET_API_PORT"
  start_proxy "$LOCAL_DB_PORT" "$target_host" "$TARGET_DB_PORT"

  if is_stack_running; then
    wait_for_local_db
    wait_for_local_api
    sync_local_email_templates
    echo "Supabase local stack is already running."
    return
  fi

  echo "Starting Supabase local stack from ${PROJECT_DIR}"
  (
    cd "$PROJECT_DIR"
    run_supabase_cli "$DOCKER_NETWORK" start --workdir "$PROJECT_DIR"
  )

  wait_for_local_db
  wait_for_local_api
  sync_local_email_templates
  reload_auth_template_cache
}

main "$@"
