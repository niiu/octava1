#!/bin/sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
export PATH="$ROOT/.runtime/node/bin:$ROOT/.runtime/ffmpeg/bin:$ROOT/bin:$PATH"
export YT_DLP_PATH="${YT_DLP_PATH:-$ROOT/bin/yt-dlp}"
if [ -x "$ROOT/.runtime/python" ]; then
  export OCTAVA_PYTHON="${OCTAVA_PYTHON:-$ROOT/.runtime/python}"
fi
export OCTAVA_HOME="$ROOT"
export OCTAVA_HOST="${OCTAVA_HOST:-0.0.0.0}"
export OCTAVA_PORT="${OCTAVA_PORT:-8080}"
export NODE_ENV=production
exec node "$ROOT/scripts/octava-serve.mjs"
