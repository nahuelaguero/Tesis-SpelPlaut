#!/usr/bin/env bash
set -euo pipefail

for candidate in /opt/homebrew/opt/node@20/bin /usr/local/opt/node@20/bin; do
  if [ -x "$candidate/node" ]; then
    export PATH="$candidate:$PATH"
    break
  fi
done

exec ./node_modules/.bin/next "$@"
