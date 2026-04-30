#!/bin/bash

set -ex

echo "=== === === === === === ls -alF === === === === === ==="
ls -alF
echo "=== === === === === === pwd === === === === === ==="
pwd

cat <<EOF >> ~/.bashrc

source ${PROJECT_DIR}/.devcontainer/.bashrc_private
EOF

# enable superpowers
mkdir -p ~/.agents/skills
ln -s ${PROJECT_DIR}/.codex/superpowers/skills ~/.agents/skills/superpowers

# enable agent-skills
ln -s ${PROJECT_DIR}/.codex/agent-skills/skills ~/.agents/skills/agent-skills
