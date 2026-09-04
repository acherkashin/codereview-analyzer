#!/usr/bin/env bash
set -e

URL="http://localhost:5173"
PROFILE_DIR="/tmp/chrome-dev-disabled-security"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_DIR"

source "$HOME/.nvm/nvm.sh"
nvm use

YARN_CLI="$NVM_BIN/../lib/node_modules/corepack/dist/yarn.js"
if [[ ! -f "$YARN_CLI" ]]; then
  echo "Corepack Yarn CLI was not found for Node $(node --version): $YARN_CLI" >&2
  exit 1
fi

node "$YARN_CLI" start &
DEV_PID=$!
trap 'kill $DEV_PID 2>/dev/null || true' EXIT

until curl -s -o /dev/null "$URL"; do
  sleep 1
done

open -na "Google Chrome" --args \
  --user-data-dir="$PROFILE_DIR" \
  --disable-web-security \
  "$URL"

wait $DEV_PID
