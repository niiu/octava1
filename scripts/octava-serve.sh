#!/usr/bin/env bash
# Процесс службы Octava. systemd и «octava start» запускают этот файл.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PATH="$ROOT/node_modules/.bin:$ROOT/bin:${PATH:-/usr/bin}"
export YT_DLP_PATH="${YT_DLP_PATH:-$ROOT/bin/yt-dlp}"
HOST="${OCTAVA_HOST:-0.0.0.0}"
PORT="${OCTAVA_PORT:-8080}"
exec node "$ROOT/scripts/with-app-env.mjs" vite dev --host "$HOST" --port "$PORT"
