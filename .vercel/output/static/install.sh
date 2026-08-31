#!/usr/bin/env bash
# Octava — автоустановка загрузчика аудио с YouTube
# Запускать из корня проекта:  bash install.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

say() { printf '\n==> %s\n' "$*"; }
need_cmd() { command -v "$1" >/dev/null 2>&1; }

say "Octava installer"

if ! need_cmd node; then
  echo "Нужен Node.js 20+. Установите с https://nodejs.org и запустите скрипт снова."
  exit 1
fi
NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Node $NODE_MAJOR слишком старый, нужен 20+."
  exit 1
fi

install_ffmpeg() {
  if need_cmd ffmpeg; then
    echo "ffmpeg уже есть: $(command -v ffmpeg)"
    return
  fi
  say "Ставим ffmpeg"
  if need_cmd brew; then
    brew install ffmpeg
  elif need_cmd apt-get; then
    sudo apt-get update -y
    sudo apt-get install -y ffmpeg
  elif need_cmd dnf; then
    sudo dnf install -y ffmpeg
  elif need_cmd pacman; then
    sudo pacman -Sy --noconfirm ffmpeg
  else
    echo "Не удалось поставить ffmpeg автоматически. Установите его вручную и повторите."
    exit 1
  fi
}

install_ytdlp() {
  mkdir -p "$ROOT/bin"
  local dest="$ROOT/bin/yt-dlp"
  if [ -x "$dest" ]; then
    echo "yt-dlp уже есть, пробуем обновить…"
    "$dest" -U || true
    return
  fi
  say "Скачиваем yt-dlp"
  if need_cmd curl; then
    curl -fsSL "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" -o "$dest"
  elif need_cmd wget; then
    wget -qO "$dest" "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"
  else
    echo "Нужен curl или wget, чтобы скачать yt-dlp."
    exit 1
  fi
  chmod +x "$dest"
}

pick_python() {
  if need_cmd python3.11; then echo python3.11; return; fi
  if need_cmd python3; then echo python3; return; fi
  echo ""
}

install_ffmpeg
install_ytdlp

PY="$(pick_python)"
if [ -z "$PY" ]; then
  echo "Нужен Python 3.10+ — yt-dlp на нём работает."
  exit 1
fi
echo "Python: $PY ($($PY --version 2>&1))"
echo "yt-dlp: $("$ROOT/bin/yt-dlp" --version 2>/dev/null || echo '?')"

say "npm install"
if [ -f package-lock.json ]; then
  npm ci || npm install
else
  npm install
fi

export YT_DLP_PATH="$ROOT/bin/yt-dlp"
export PATH="$ROOT/bin:$PATH"

say "Готово. Поднимаю веб-морду на 0.0.0.0:8080"
echo "Остановка — Ctrl+C. Cookies: положите cookies.txt в $ROOT"
echo

if grep -q '"dev"' package.json; then
  npm run dev
else
  echo "В package.json нет скрипта dev."
  exit 1
fi
