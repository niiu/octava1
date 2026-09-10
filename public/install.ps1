# Octava — автоустановка на Windows
# Ставит Node.js LTS, Python 3.11+, ffmpeg, yt-dlp и поднимает службу.
# Запуск из корня проекта:
#   powershell -ExecutionPolicy Bypass -File .\install.ps1
# Передний план:
#   powershell -ExecutionPolicy Bypass -File .\install.ps1 -Foreground
[CmdletBinding()]
param(
  [switch]$Foreground,
  [switch]$Help,
  [int]$Port = 0
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if ($Help) {
  Write-Host "install.ps1              зависимости (Node LTS, Python 3, ffmpeg, yt-dlp) + служба"
  Write-Host "install.ps1 -Foreground  запуск на переднем плане"
  Write-Host "install.ps1 -Port 8787   сразу слушать этот порт"
  exit 0
}

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
$Runtime = Join-Path $Root ".runtime"
New-Item -ItemType Directory -Force -Path $Runtime, (Join-Path $Root "bin") | Out-Null

function Say([string]$Text) { Write-Host ""; Write-Host "==> $Text" }
function Have-Cmd([string]$Name) { [bool](Get-Command $Name -ErrorAction SilentlyContinue) }

function Get-Arch {
  if ($env:PROCESSOR_ARCHITECTURE -match "ARM64") { return "arm64" }
  return "x64"
}

function Add-RuntimePath {
  $parts = @(
    (Join-Path $Runtime "node"),
    (Join-Path $Runtime "ffmpeg\bin"),
    (Join-Path $Runtime "ffmpeg"),
    (Join-Path $Root "bin"),
    (Join-Path $Runtime "python"),
    (Join-Path $Runtime "python\Scripts")
  ) | Where-Object { Test-Path $_ }
  $env:PATH = ($parts + $env:PATH) -join ";"
}

function Download-File([string]$Url, [string]$Dest) {
  Write-Host "качаю $Url"
  Invoke-WebRequest -Uri $Url -OutFile $Dest -UseBasicParsing
}

function Expand-Zip([string]$Zip, [string]$Dest) {
  if (Test-Path $Dest) { Remove-Item $Dest -Recurse -Force }
  New-Item -ItemType Directory -Force -Path $Dest | Out-Null
  Expand-Archive -LiteralPath $Zip -DestinationPath $Dest -Force
}

function Node-Major {
  if (-not (Have-Cmd "node")) { return 0 }
  try { return [int](& node -p "parseInt(process.versions.node,10)") } catch { return 0 }
}

function Python-Code([string]$Bin) {
  if (-not (Test-Path $Bin) -and -not (Have-Cmd $Bin)) { return 0 }
  try {
    $out = & $Bin -c "import sys;print(sys.version_info.major*100+sys.version_info.minor)" 2>$null
    return [int]("$out".Trim())
  } catch { return 0 }
}

function Find-Python {
  $candidates = @(
    $env:OCTAVA_PYTHON,
    (Join-Path $Runtime "python\python.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\Python\Python313\python.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\Python\Python312\python.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\Python\Python311\python.exe")
  )
  $cmd = Get-Command python -ErrorAction SilentlyContinue
  if ($cmd) { $candidates += $cmd.Source }
  foreach ($c in $candidates) {
    if ($c -and ((Test-Path $c) -or (Have-Cmd $c))) {
      if ((Python-Code $c) -ge 311) { return $c }
    }
  }
  return $null
}

function Try-Winget([string]$Id) {
  if (-not (Have-Cmd "winget")) { return $false }
  & winget install --id $Id -e --scope user --accept-package-agreements --accept-source-agreements --disable-interactivity
  return ($LASTEXITCODE -eq 0)
}

function Install-Node {
  Say "Node.js LTS"
  Add-RuntimePath
  if ((Node-Major) -ge 22) {
    Write-Host "Node уже есть: $(Get-Command node | Select-Object -ExpandProperty Source) ($(node -v))"
    return
  }
  $arch = if ((Get-Arch) -eq "arm64") { "win-arm64" } else { "win-x64" }
  $index = Invoke-RestMethod "https://nodejs.org/dist/index.json"
  $row = $index | Where-Object { $_.lts } | Select-Object -First 1
  if (-not $row) { throw "Не удалось узнать версию Node LTS" }
  $ver = $row.version.TrimStart("v")
  $zip = Join-Path $Runtime "node.zip"
  Download-File "https://nodejs.org/dist/v$ver/node-v$ver-$arch.zip" $zip
  $unpack = Join-Path $Runtime "node-unpack"
  Expand-Zip $zip $unpack
  $inner = Get-ChildItem $unpack -Directory | Select-Object -First 1
  $dest = Join-Path $Runtime "node"
  if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
  Move-Item $inner.FullName $dest
  Remove-Item $unpack, $zip -Recurse -Force -ErrorAction SilentlyContinue
  Add-RuntimePath
  if ((Node-Major) -lt 20) { throw "Нужен Node.js 20+. Установка не удалась." }
  Write-Host "Node: $(Get-Command node | Select-Object -ExpandProperty Source) ($(node -v))"
}

function Install-Python {
  Say "Python 3.11+"
  $existing = Find-Python
  if ($existing) {
    Write-Host "Python уже есть: $existing"
    $env:OCTAVA_PYTHON = $existing
    return
  }
  if (Try-Winget "Python.Python.3.12") {
    $env:PATH = "$env:LOCALAPPDATA\Programs\Python\Python312;$env:LOCALAPPDATA\Programs\Python\Python312\Scripts;$env:PATH"
  }
  $found = Find-Python
  if ($found) {
    $env:OCTAVA_PYTHON = $found
    Write-Host "Python: $found"
    return
  }
  $arch = Get-Arch
  $name = if ($arch -eq "arm64") { "python-3.12.10-arm64.exe" } else { "python-3.12.10-amd64.exe" }
  $setup = Join-Path $Runtime $name
  Download-File "https://www.python.org/ftp/python/3.12.10/$name" $setup
  $target = Join-Path $Runtime "python"
  $args = "/quiet InstallAllUsers=0 PrependPath=0 Include_test=0 Include_pip=1 TargetDir=`"$target`""
  $p = Start-Process -FilePath $setup -ArgumentList $args -Wait -PassThru
  if ($p.ExitCode -ne 0) { throw "Установщик Python завершился с кодом $($p.ExitCode)" }
  $py = Join-Path $target "python.exe"
  if (-not (Test-Path $py)) { throw "python.exe не появился в $target" }
  $env:OCTAVA_PYTHON = $py
  Add-RuntimePath
  Write-Host "Python: $py ($(& $py --version 2>&1))"
}

function Install-Ffmpeg {
  Say "ffmpeg"
  Add-RuntimePath
  if (Have-Cmd "ffmpeg") {
    Write-Host "ffmpeg уже есть: $((Get-Command ffmpeg).Source)"
    return
  }
  if (Try-Winget "Gyan.FFmpeg") {
    Add-RuntimePath
    if (Have-Cmd "ffmpeg") { Write-Host "ffmpeg из winget"; return }
  }
  $zip = Join-Path $Runtime "ffmpeg.zip"
  $url = if ((Get-Arch) -eq "arm64") {
    "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-winarm64-gpl.zip"
  } else {
    "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
  }
  Download-File $url $zip
  $unpack = Join-Path $Runtime "ffmpeg-unpack"
  Expand-Zip $zip $unpack
  $bin = Get-ChildItem $unpack -Recurse -Filter "ffmpeg.exe" | Select-Object -First 1
  if (-not $bin) { throw "В архиве ffmpeg нет ffmpeg.exe" }
  $dest = Join-Path $Runtime "ffmpeg"
  if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
  $prefix = $bin.Directory.Parent.FullName
  if (Test-Path (Join-Path $prefix "bin\ffmpeg.exe")) {
    Move-Item $prefix $dest
  } else {
    New-Item -ItemType Directory -Force -Path (Join-Path $dest "bin") | Out-Null
    Move-Item $bin.FullName (Join-Path $dest "bin\ffmpeg.exe")
  }
  Remove-Item $unpack, $zip -Recurse -Force -ErrorAction SilentlyContinue
  Add-RuntimePath
  if (-not (Have-Cmd "ffmpeg")) { throw "ffmpeg не появился в PATH" }
  Write-Host "ffmpeg: $((Get-Command ffmpeg).Source)"
}

function Install-YtDlp {
  Say "yt-dlp latest"
  $dest = Join-Path $Root "bin\yt-dlp.exe"
  Download-File "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" $dest
  try { & $dest -U | Out-Null } catch { }
  Write-Host "yt-dlp: $(& $dest --version 2>$null)"
}

Say "Octava installer (Windows)"
Write-Host "корень: $Root"

Install-Python
Install-Node
Install-Ffmpeg
Install-YtDlp
Add-RuntimePath

$env:YT_DLP_PATH = Join-Path $Root "bin\yt-dlp.exe"
if (-not $env:OCTAVA_PYTHON) { $env:OCTAVA_PYTHON = Find-Python }

Write-Host ""
Write-Host "--- версии ---"
Write-Host "node    $(node -v)  $((Get-Command node).Source)"
Write-Host "npm     $(npm -v)"
Write-Host "python  $(& $env:OCTAVA_PYTHON --version 2>&1)  $($env:OCTAVA_PYTHON)"
Write-Host "ffmpeg  $((& ffmpeg -version | Select-Object -First 1))"
Write-Host "yt-dlp  $(& $env:YT_DLP_PATH --version 2>$null)"
Write-Host "--------------"

Say "npm install"
Add-RuntimePath
$env:PATH = "$(Join-Path $Root 'node_modules\.bin');$env:PATH"
$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npm) { $npm = Get-Command npm -ErrorAction SilentlyContinue }
if (-not $npm) { throw "npm не найден после установки Node.js" }
if (Test-Path (Join-Path $Root "package-lock.json")) {
  & $npm.Source ci
  if ($LASTEXITCODE -ne 0) { & $npm.Source install }
} else {
  & $npm.Source install
}
if ($LASTEXITCODE -ne 0) { throw "npm install не удался" }

Say "Сборка production"
$env:NODE_OPTIONS = "--max-old-space-size=4096"
$env:PATH = "$(Join-Path $Root 'node_modules\.bin');$env:PATH"
& $npm.Source run build
if ($LASTEXITCODE -ne 0) { throw "Сборка не удалась." }

$cli = Join-Path $Root "bin\octava.cmd"
if ($Port -gt 0) {
  New-Item -ItemType Directory -Force -Path (Join-Path $Root ".run") | Out-Null
  Set-Content -Path (Join-Path $Root ".run\octava.wanted-port") -Value "$Port" -Encoding ASCII
  $env:OCTAVA_PORT = "$Port"
  $env:OCTAVA_PORT_STRICT = "1"
}
if ($Foreground) {
  Say "Передний план. Остановка — Ctrl+C."
  Write-Host "Cookies YouTube: поле на главной или cookies.txt в $Root"
  Write-Host ""
  & node (Join-Path $Root "scripts\octava-serve.mjs")
  exit $LASTEXITCODE
}

Say "Служба в фоне"
$enableExit = 0
& $cli enable
if ($LASTEXITCODE) { $enableExit = $LASTEXITCODE }
& $cli status
if ($LASTEXITCODE -eq 3) {
  Write-Host ""
  Write-Host "Сервер не слушает. Хвост лога:"
  $log = Join-Path $Root ".run\octava.log"
  if (Test-Path $log) { Get-Content $log -Tail 50 }
  throw "Octava не поднялась. Смотрите .run\octava.log"
}

$portFile = Join-Path $Root ".run\octava.port"
$port = "8080"
if (Test-Path $portFile) { $port = (Get-Content $portFile | Select-Object -First 1).Trim() }
Write-Host ""
Write-Host "Управление:"
Write-Host "  .\bin\octava.cmd start"
Write-Host "  .\bin\octava.cmd stop"
Write-Host "  .\bin\octava.cmd status"
Write-Host "  .\bin\octava.cmd logs"
Write-Host "  .\bin\octava.cmd enable"
Write-Host "Файл лога: $Root\.run\octava.log"
Write-Host "Откройте http://127.0.0.1:$port/"
Write-Host ""
Write-Host "Cookies YouTube: поле на главной или cookies.txt в $Root"
