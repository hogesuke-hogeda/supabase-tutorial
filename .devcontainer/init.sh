#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

DOCKER_NETWORK="br-supabase-tutorial-${USER}"
NETWORK_EXISTS=$(docker network ls --filter "name=${DOCKER_NETWORK}" --format '{{.Name}}')

if [ -z "$NETWORK_EXISTS" ]; then
  docker network create -o 'com.docker.network.bridge.host_binding_ipv4=127.0.0.1' "$DOCKER_NETWORK"
fi
