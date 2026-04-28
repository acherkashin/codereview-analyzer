#!/usr/bin/env bash
set -e

URL="http://localhost:5173"
PROFILE_DIR="/tmp/chrome-dev-disabled-security"

cd "$(dirname "$0")/.."

yarn start &
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
