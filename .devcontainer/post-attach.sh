#!/bin/bash

set -euo pipefail

mkdir -p $HOME/.docker

# .docker/config.jsonにcredsStoreが自動で追記されてしまうため、空のファイルで上書きする
cat <<EOF > $HOME/.docker/config.json
{}
EOF

/bin/bash "${PROJECT_DIR}/bin/start-supabase.sh"
