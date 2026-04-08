#!/bin/bash

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-}"

TARGET_DB_HOST="${SUPABASE_DB_HOST:-}"
TARGET_DB_PORT="${SUPABASE_DB_PORT:-54322}"
TARGET_API_HOST="${SUPABASE_API_HOST:-$TARGET_DB_HOST}"
TARGET_API_PORT="${SUPABASE_API_PORT:-54321}"

LOCAL_HOST="127.0.0.1"
LOCAL_DB_PORT="${SUPABASE_LOCAL_DB_PORT:-54322}"
LOCAL_API_PORT="${SUPABASE_LOCAL_API_PORT:-54321}"

SUPABASE_NETWORK_ID="${SUPABASE_NETWORK_ID:-${DOCKER_NETWORK:-}}"
MODE="${1:-reset}"
shift $(( $# > 0 ? 1 : 0 ))

PROXY_PIDS=()
TARGET_DB_HOST_RESOLVED=""
TARGET_API_HOST_RESOLVED=""

usage() {
  cat <<'EOF'
Usage:
  /bin/bash bin/init-db.sh [reset|up] [additional supabase args...]

Modes:
  reset (default)  Reset DB and re-apply all migrations (+ seed.sql)
  up               Apply only pending migrations

Environment:
  SUPABASE_DB_HOST        Optional override for target DB host
                          (default: container-visible host gateway IP)
  SUPABASE_DB_PORT        Optional override for target DB port (default: 54322)
  SUPABASE_API_HOST       Optional override for target API host
                          (default: same as SUPABASE_DB_HOST)
  SUPABASE_API_PORT       Optional override for target API port (default: 54321)
  SUPABASE_LOCAL_DB_PORT  Optional override for local DB proxy listen port (default: 54322)
  SUPABASE_LOCAL_API_PORT Optional override for local API proxy listen port (default: 54321)
  SUPABASE_NETWORK_ID     Optional override for Supabase Docker network ID
                          (default: DOCKER_NETWORK environment variable)
EOF
}

die() {
  echo "error: $*" >&2
  exit 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    die "$1 is not available in this container."
  fi
}

run_supabase() {
  local -a network_args=()
  if [ -n "$SUPABASE_NETWORK_ID" ]; then
    network_args+=(--network-id "$SUPABASE_NETWORK_ID")
  fi

  if command -v supabase >/dev/null 2>&1; then
    supabase "${network_args[@]}" "$@"
    return
  fi

  # Keep the npx cache under /tmp so the script works even when $HOME is read-only.
  local npx_cache_dir="${NPX_CACHE_DIR:-/tmp/.npm-cache}"
  mkdir -p "$npx_cache_dir"
  npm_config_cache="$npx_cache_dir" npx --yes supabase "${network_args[@]}" "$@"
}

cleanup() {
  local proxy_pid
  for proxy_pid in "${PROXY_PIDS[@]:-}"; do
    if [ -n "$proxy_pid" ] && kill -0 "$proxy_pid" >/dev/null 2>&1; then
      kill "$proxy_pid" >/dev/null 2>&1 || true
      wait "$proxy_pid" 2>/dev/null || true
    fi
  done
}

validate_mode() {
  case "$MODE" in
    reset|up)
      ;;
    -h|--help|help)
      usage
      exit 0
      ;;
    *)
      usage >&2
      die "unknown mode: $MODE"
      ;;
  esac
}

resolve_default_target_host() {
  ip route | awk '/default/ { print $3; exit }'
}

resolve_target_hosts() {
  # Do not use `--db-url` or Supabase service container names from the devcontainer.
  # `--db-url` is treated as a remote connection by the CLI and hit TLS errors
  # against the local Postgres container, so this script must stay on `--local`.
  # During `db reset`, container recreation also made name resolution to
  # `supabase_db_supabase-tutorial` unreliable in practice. The host gateway
  # plus published ports stays stable across those restarts.
  TARGET_DB_HOST_RESOLVED="${TARGET_DB_HOST:-$(resolve_default_target_host)}"
  TARGET_API_HOST_RESOLVED="${TARGET_API_HOST:-$TARGET_DB_HOST_RESOLVED}"

  if [ -z "$TARGET_DB_HOST_RESOLVED" ]; then
    die "cannot resolve database target host. Ensure Supabase local stack is running before initializing DB."
  fi
}

require_reachable_database_target() {
  if ! pg_isready -h "$TARGET_DB_HOST_RESOLVED" -p "$TARGET_DB_PORT" -d postgres >/dev/null 2>&1; then
    die "cannot reach database target: ${TARGET_DB_HOST_RESOLVED}:${TARGET_DB_PORT}. Ensure Supabase local stack is running before initializing DB."
  fi
}

is_local_db_reachable() {
  pg_isready -h "$LOCAL_HOST" -p "$LOCAL_DB_PORT" -d postgres >/dev/null 2>&1
}

is_local_api_reachable() {
  curl -sS -o /dev/null "http://${LOCAL_HOST}:${LOCAL_API_PORT}/rest/v1/" >/dev/null 2>&1
}

start_tcp_proxy() {
  local listen_port="$1"
  local target_host="$2"
  local target_port="$3"
  local proxy_pid

  trap cleanup EXIT

  # Keep retrying the upstream connect while Supabase recreates containers during `db reset`.
  socat \
    "TCP-LISTEN:${listen_port},bind=${LOCAL_HOST},reuseaddr,fork" \
    "TCP:${target_host}:${target_port},connect-timeout=1,retry=240,interval=0.25" \
    >/tmp/init-db-proxy-"${listen_port}".log 2>&1 &
  proxy_pid=$!
  PROXY_PIDS+=("$proxy_pid")

  sleep 1

  if ! kill -0 "$proxy_pid" >/dev/null 2>&1; then
    die "failed to start local proxy on ${LOCAL_HOST}:${listen_port}"
  fi
}

ensure_local_db_proxy() {
  # `supabase ... --local` always dials localhost, even inside the devcontainer.
  if ! is_local_db_reachable; then
    start_tcp_proxy "$LOCAL_DB_PORT" "$TARGET_DB_HOST_RESOLVED" "$TARGET_DB_PORT"
  fi

  if ! is_local_db_reachable; then
    die "local DB proxy is not reachable on ${LOCAL_HOST}:${LOCAL_DB_PORT}"
  fi
}

ensure_local_api_proxy() {
  # `supabase db reset --local` performs post-reset health checks against localhost API endpoints.
  if ! is_local_api_reachable; then
    start_tcp_proxy "$LOCAL_API_PORT" "$TARGET_API_HOST_RESOLVED" "$TARGET_API_PORT"
  fi

  if ! is_local_api_reachable; then
    die "local API proxy is not reachable on ${LOCAL_HOST}:${LOCAL_API_PORT}"
  fi
}

run_mode() {
  case "$MODE" in
    reset)
      ensure_local_api_proxy
      echo "Running: supabase db reset --local"
      (
        cd "$PROJECT_DIR"
        run_supabase db reset --local "$@"
      )
      ;;
    up)
      echo "Running: supabase migration up --local"
      (
        cd "$PROJECT_DIR"
        run_supabase migration up --local "$@"
      )
      ;;
  esac
}

main() {
  validate_mode
  require_command curl
  require_command psql
  require_command socat
  if [ -z "$PROJECT_DIR" ]; then
    die "PROJECT_DIR is not set. Run this script from the devcontainer."
  fi
  if [ -z "$SUPABASE_NETWORK_ID" ]; then
    die "DOCKER_NETWORK or SUPABASE_NETWORK_ID is not set. Run this script from the devcontainer."
  fi
  resolve_target_hosts
  require_reachable_database_target
  ensure_local_db_proxy
  run_mode "$@"
}

main "$@"
