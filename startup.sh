#!/bin/sh
set -eu
cd /workspace
# :8081 is QA-only — a revive must never inherit a stale built-output preview.
node scripts/preview.mjs stop || true
if [ ! -x /workspace/bin/yt-dlp ]; then
  mkdir -p /workspace/bin
  curl -fsSL "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" -o /workspace/bin/yt-dlp && chmod +x /workspace/bin/yt-dlp || true
fi
export PATH="/workspace/bin:${PATH}"
export YT_DLP_PATH="/workspace/bin/yt-dlp"
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
