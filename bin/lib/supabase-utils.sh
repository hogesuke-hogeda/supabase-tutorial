#!/bin/bash

die() {
  echo "error: $*" >&2
  exit 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    die "$1 is not available in this container."
  fi
}

resolve_supabase_target_host() {
  local target_host="${1:-}"

  if [ -n "$target_host" ]; then
    echo "$target_host"
    return
  fi

  ip route | awk '/default/ { print $3; exit }'
}

run_supabase_cli() {
  local network_id="$1"
  shift

  local -a network_args=()
  if [ -n "$network_id" ]; then
    network_args+=(--network-id "$network_id")
  fi

  if command -v supabase >/dev/null 2>&1; then
    supabase "${network_args[@]}" "$@"
    return
  fi

  local npx_cache_dir="${NPX_CACHE_DIR:-/tmp/.npm-cache}"
  mkdir -p "$npx_cache_dir"
  npm_config_cache="$npx_cache_dir" npx --yes supabase "${network_args[@]}" "$@"
}

is_supabase_local_db_reachable() {
  local host="${1:-127.0.0.1}"
  local port="${2:-54322}"

  pg_isready -h "$host" -p "$port" -d postgres >/dev/null 2>&1
}

is_supabase_local_api_reachable() {
  local host="${1:-127.0.0.1}"
  local port="${2:-54321}"

  curl -sS -o /dev/null "http://${host}:${port}/rest/v1/" >/dev/null 2>&1
}
