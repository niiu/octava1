#!/usr/bin/env bash
# Процесс службы Octava. systemd и «octava start» запускают этот файл.
# Только production: готовые JS-бандлы, без Vite HMR и без .tsx по сети.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PATH="$ROOT/node_modules/.bin:$ROOT/bin:${PATH:-/usr/bin}"
export YT_DLP_PATH="${YT_DLP_PATH:-$ROOT/bin/yt-dlp}"
HOST="${OCTAVA_HOST:-0.0.0.0}"
PORT="${OCTAVA_PORT:-8080}"
export OCTAVA_HOST="$HOST"
export OCTAVA_PORT="$PORT"
export HOST
export PORT
export NODE_ENV=production

STATIC="$ROOT/.vercel/output/static"
ENTRY="$ROOT/.vercel/output/functions/__server.func/index.mjs"

if [ ! -d "$STATIC" ] || [ ! -f "$ENTRY" ]; then
  echo "octava: нет production-сборки." >&2
  echo "Запустите из корня проекта:  bash install.sh" >&2
  echo "или:  npm run build && octava restart" >&2
  exit 1
fi

echo "octava: production http://${HOST}:${PORT}" >&2
exec node "$ROOT/scripts/with-app-env.mjs" srvx serve --prod \
  --host="$HOST" \
  --port="$PORT" \
  --static="$STATIC" \
  --entry="$ENTRY"
