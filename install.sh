#!/usr/bin/env bash
# Octava — автоустановка загрузчика аудио с YouTube
# Ставит Node.js LTS, свежий Python 3, ffmpeg, yt-dlp и поднимает службу.
# Запускать из корня проекта:  bash install.sh
# Передний план:  bash install.sh --foreground
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
RUNTIME="$ROOT/.runtime"
mkdir -p "$RUNTIME" "$ROOT/bin"

FOREGROUND=0
for arg in "$@"; do
  case "$arg" in
    --foreground|-f) FOREGROUND=1 ;;
    --help|-h)
      echo "bash install.sh              зависимости (Node LTS, Python 3, ffmpeg, yt-dlp) + служба"
      echo "bash install.sh --foreground запуск на переднем плане"
      exit 0
      ;;
  esac
done

say() { printf '\n==> %s\n' "$*"; }
need_cmd() { command -v "$1" >/dev/null 2>&1; }

os_family() {
  if need_cmd apt-get; then echo debian; return; fi
  if need_cmd dnf; then echo fedora; return; fi
  if need_cmd pacman; then echo arch; return; fi
  if need_cmd brew; then echo brew; return; fi
  echo unknown
}

run_root() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  elif need_cmd sudo; then
    sudo "$@"
  else
    return 1
  fi
}

pkg_install() {
  local fam
  fam="$(os_family)"
  case "$fam" in
    debian)
      run_root apt-get update -y
      run_root apt-get install -y --no-install-recommends "$@"
      ;;
    fedora) run_root dnf install -y "$@" ;;
    arch) run_root pacman -Sy --noconfirm "$@" ;;
    brew) brew install "$@" ;;
    *)
      echo "Неизвестный пакетный менеджер, пропускаю: $*"
      return 1
      ;;
  esac
}

node_major() {
  need_cmd node || { echo 0; return; }
  node -p "parseInt(process.versions.node,10)" 2>/dev/null || echo 0
}

python_minor() {
  local bin="${1:-python3}"
  if ! command -v "$bin" >/dev/null 2>&1 && [ ! -x "$bin" ]; then
    echo 0
    return
  fi
  "$bin" - <<'PY' 2>/dev/null || echo 0
import sys
print(sys.version_info.major * 100 + sys.version_info.minor)
PY
}

pick_python() {
  local c
  for c in \
    "${OCTAVA_PYTHON:-}" \
    "$RUNTIME/python" \
    python3.14 python3.13 python3.12 python3.11 \
    python3; do
    [ -n "$c" ] || continue
    if need_cmd "$c" || [ -x "$c" ]; then
      if [ "$(python_minor "$c")" -ge 311 ]; then
        echo "$c"
        return
      fi
    fi
  done
  echo ""
}

install_base() {
  say "Базовые пакеты"
  case "$(os_family)" in
    debian)
      pkg_install ca-certificates curl wget gnupg xz-utils git || pkg_install curl wget git || true
      ;;
    fedora) pkg_install curl wget tar xz git || true ;;
    arch) pkg_install curl wget xz git || true ;;
    brew) pkg_install git curl wget || true ;;
  esac
}

install_python() {
  say "Python 3.11+ (yt-dlp больше не запускается на 3.10)"
  case "$(os_family)" in
    debian)
      pkg_install python3 python3-venv python3-pip || true
      if [ "$(python_minor python3)" -lt 312 ]; then
        echo "Системный Python старше 3.12 — yt-dlp уже не берёт 3.10, ставим 3.12 (deadsnakes)"
        pkg_install software-properties-common || true
        if run_root add-apt-repository -y ppa:deadsnakes/ppa 2>/dev/null; then
          run_root apt-get update -y || true
        fi
        pkg_install python3.13 python3.13-venv \
          || pkg_install python3.12 python3.12-venv \
          || pkg_install python3.11 python3.11-venv \
          || true
      fi
      ;;
    fedora) pkg_install python3.12 python3.12-pip || pkg_install python3 python3-pip || true ;;
    arch) pkg_install python python-pip || true ;;
    brew) pkg_install python@3.12 || pkg_install python || true ;;
  esac

  local py
  py="$(pick_python)"
  if [ -z "$py" ]; then
    echo "Не удалось поставить Python 3.11+. yt-dlp отказался от 3.10."
    echo "Ubuntu 22.04: sudo add-apt-repository ppa:deadsnakes/ppa && sudo apt install python3.12"
    exit 1
  fi
  ln -sfn "$(command -v "$py")" "$RUNTIME/python"
  export OCTAVA_PYTHON="$RUNTIME/python"
  echo "Python: $py ($("$py" --version 2>&1))"
}

install_node_tarball() {
  local uname_s uname_m arch ver url tmp
  uname_s="$(uname -s)"
  uname_m="$(uname -m)"
  case "$uname_s-$uname_m" in
    Linux-x86_64) arch="linux-x64" ;;
    Linux-aarch64|Linux-arm64) arch="linux-arm64" ;;
    Darwin-x86_64) arch="darwin-x64" ;;
    Darwin-arm64) arch="darwin-arm64" ;;
    *)
      echo "Нет готового бинарника Node для $uname_s $uname_m"
      return 1
      ;;
  esac
  say "Скачиваем Node.js LTS ($arch)"
  ver="$(
    curl -fsSL https://nodejs.org/dist/index.json \
      | "$RUNTIME/python" -c 'import json,sys
data=json.load(sys.stdin)
for row in data:
    if row.get("lts"):
        print(row["version"].lstrip("v"))
        break
'
  )"
  if [ -z "${ver:-}" ]; then
    echo "Не удалось узнать версию Node LTS"
    return 1
  fi
  url="https://nodejs.org/dist/v${ver}/node-v${ver}-${arch}.tar.xz"
  tmp="$(mktemp)"
  curl -fsSL "$url" -o "$tmp"
  rm -rf "$RUNTIME/node"
  mkdir -p "$RUNTIME/node"
  tar -xJf "$tmp" -C "$RUNTIME/node" --strip-components=1
  rm -f "$tmp"
  export PATH="$RUNTIME/node/bin:$PATH"
  echo "Node.js v$ver → $RUNTIME/node"
}

install_node() {
  say "Node.js LTS (20+ , лучше 22)"
  export PATH="$RUNTIME/node/bin:$PATH"
  if [ "$(node_major)" -ge 22 ]; then
    echo "Node уже есть: $(command -v node) ($(node -v))"
    return
  fi
  case "$(os_family)" in
    debian)
      if run_root bash -c 'curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -' \
        && run_root apt-get install -y nodejs; then
        echo "Node из NodeSource: $(node -v)"
      else
        echo "NodeSource не вышел — качаю официальный tar"
        install_node_tarball
      fi
      ;;
    fedora)
      pkg_install nodejs npm || install_node_tarball
      ;;
    arch)
      pkg_install nodejs npm || install_node_tarball
      ;;
    brew)
      brew install node || install_node_tarball
      ;;
    *)
      install_node_tarball
      ;;
  esac
  export PATH="$RUNTIME/node/bin:$PATH"
  if [ "$(node_major)" -lt 20 ]; then
    echo "Node $(node -v 2>/dev/null || echo отсутствует) слишком старый, качаю LTS"
    install_node_tarball
  fi
  if [ "$(node_major)" -lt 20 ]; then
    echo "Нужен Node.js 20+. Установка не удалась."
    exit 1
  fi
  echo "Node: $(command -v node) ($(node -v))  npm $(npm -v)"
}

install_ffmpeg() {
  say "ffmpeg"
  if need_cmd ffmpeg; then
    echo "ffmpeg уже есть: $(command -v ffmpeg) ($(ffmpeg -version 2>/dev/null | head -1))"
    return
  fi
  case "$(os_family)" in
    debian) pkg_install ffmpeg ;;
    fedora) pkg_install ffmpeg ;;
    arch) pkg_install ffmpeg ;;
    brew) brew install ffmpeg ;;
    *)
      echo "Поставьте ffmpeg вручную и повторите."
      exit 1
      ;;
  esac
  need_cmd ffmpeg || { echo "ffmpeg не появился в PATH"; exit 1; }
  echo "ffmpeg: $(command -v ffmpeg)"
}

install_ytdlp() {
  say "yt-dlp latest"
  mkdir -p "$ROOT/bin"
  local dest="$ROOT/bin/yt-dlp"
  if need_cmd curl; then
    curl -fsSL "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" -o "$dest"
  elif need_cmd wget; then
    wget -qO "$dest" "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"
  else
    echo "Нужен curl или wget, чтобы скачать yt-dlp."
    exit 1
  fi
  chmod +x "$dest"
  "$dest" -U >/dev/null 2>&1 || true
  echo "yt-dlp: $("$dest" --version 2>/dev/null || echo '?')"
}

say "Octava installer"
echo "корень: $ROOT"

install_base
install_python
install_node
install_ffmpeg
install_ytdlp

export PATH="$RUNTIME/node/bin:$ROOT/bin:$PATH"
export YT_DLP_PATH="$ROOT/bin/yt-dlp"
export OCTAVA_PYTHON="${OCTAVA_PYTHON:-$RUNTIME/python}"

echo
echo "--- версии ---"
echo "node    $(node -v)  ($(command -v node))"
echo "npm     $(npm -v)"
echo "python  $("$OCTAVA_PYTHON" --version 2>&1)  ($OCTAVA_PYTHON)"
echo "ffmpeg  $(ffmpeg -version 2>/dev/null | head -1)"
echo "yt-dlp  $("$YT_DLP_PATH" --version 2>/dev/null || echo '?')"
echo "--------------"

say "npm install"
if [ -f package-lock.json ]; then
  npm ci || npm install
else
  npm install
fi

say "Сборка production (без Vite — страница не тянет .tsx по сети)"
if ! npm run build; then
  echo "Сборка не удалась. На слабом сервере попробуйте:"
  echo "  NODE_OPTIONS=--max-old-space-size=2048 npm run build"
  exit 1
fi
if [ ! -d "$ROOT/.vercel/output/static" ] || [ ! -f "$ROOT/.vercel/output/functions/__server.func/index.mjs" ]; then
  echo "Сборка не создала .vercel/output. Повторите npm run build."
  exit 1
fi

chmod +x "$ROOT/bin/octava" "$ROOT/scripts/octava-serve.sh" 2>/dev/null || true

if [ "$FOREGROUND" -eq 1 ]; then
  say "Передний план. Остановка — Ctrl+C."
  echo "Cookies YouTube: поле на главной или cookies.txt в $ROOT"
  echo
  exec "$ROOT/scripts/octava-serve.sh"
fi

say "Служба в фоне"
"$ROOT/bin/octava" enable || "$ROOT/bin/octava" start

echo
echo "Управление (systemd, без алиаса octava):"
echo "  systemctl --user status octava"
echo "  systemctl --user restart octava"
echo "  journalctl --user -u octava -n 80 --no-pager"
echo "  journalctl --user -u octava -f"
echo "Файл лога: $ROOT/.run/octava.log"
echo
echo "Cookies YouTube: поле на главной (экспорт с согласия) или cookies.txt в $ROOT"
"$ROOT/bin/octava" status || true
