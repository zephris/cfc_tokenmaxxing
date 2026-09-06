#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_LOG="${TMPDIR:-/tmp}/cfc-tokenmaxxing-frontend.log"

for command in docker npm; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Required command not found: $command" >&2
    exit 1
  fi
done

cd "$REPO_ROOT"

echo "Starting database, backend, and inference services..."
docker compose up -d --build server weedscan-inference

echo "Starting frontend at http://localhost:3000..."
(
  cd client
  npm run dev
) >"$FRONTEND_LOG" 2>&1 &

echo "Frontend output: $FRONTEND_LOG"
echo "Backend: http://localhost:8000"
echo "Tailing inference logs. Press Ctrl+C to stop log tailing."
exec docker compose logs --follow weedscan-inference