#!/usr/bin/env bash
# Процесс службы Octava. systemd и «octava start» запускают этот файл.
# Production-сборка без Vite HMR: обрыв сети не перезагружает страницу.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PATH="$ROOT/node_modules/.bin:$ROOT/bin:${PATH:-/usr/bin}"
export YT_DLP_PATH="${YT_DLP_PATH:-$ROOT/bin/yt-dlp}"
HOST="${OCTAVA_HOST:-0.0.0.0}"
PORT="${OCTAVA_PORT:-8080}"
export OCTAVA_HOST="$HOST"
export OCTAVA_PORT="$PORT"

if [ -d "$ROOT/.vercel/output/static" ]; then
  export OCTAVA_PROD=1
  exec node "$ROOT/scripts/with-app-env.mjs" vite preview --host "$HOST" --port "$PORT" --strictPort
fi

echo "octava: нет production-сборки, запускаю dev без HMR" >&2
export OCTAVA_HMR=0
exec node "$ROOT/scripts/with-app-env.mjs" vite dev --host "$HOST" --port "$PORT"
