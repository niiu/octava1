#!/usr/bin/env bash
# Octava — автоустановка загрузчика аудио с YouTube
# Запускать из корня проекта:  bash install.sh
# По умолчанию поднимает службу в фоне (systemd --user на Ubuntu).
# Передний план:  bash install.sh --foreground
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

FOREGROUND=0
for arg in "$@"; do
  case "$arg" in
    --foreground|-f) FOREGROUND=1 ;;
    --help|-h)
      echo "bash install.sh            поставить зависимости и запустить в фоне"
      echo "bash install.sh --foreground   запустить на переднем плане"
      exit 0
      ;;
  esac
done

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

chmod +x "$ROOT/bin/octava" "$ROOT/scripts/octava-serve.sh" 2>/dev/null || true
export YT_DLP_PATH="$ROOT/bin/yt-dlp"
export PATH="$ROOT/bin:${PATH}"

if [ "$FOREGROUND" -eq 1 ]; then
  say "Передний план. Остановка — Ctrl+C."
  echo "Cookies YouTube: поле на главной или cookies.txt в $ROOT"
  echo
  exec "$ROOT/scripts/octava-serve.sh"
fi

say "Служба в фоне"
"$ROOT/bin/octava" enable || "$ROOT/bin/octava" start

echo
echo "Управление:"
echo "  octava start | stop | restart | status | logs"
echo "  systemctl --user enable --now octava"
echo "  systemctl --user stop octava"
echo
echo "Cookies YouTube: поле на главной (экспорт с согласия) или cookies.txt в $ROOT"
"$ROOT/bin/octava" status || true
