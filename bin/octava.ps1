param(
  [Parameter(Position = 0)]
  [string]$Command = "help"
)

$ErrorActionPreference = "Stop"
$BinDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = if ($env:OCTAVA_HOME) { $env:OCTAVA_HOME } else { Resolve-Path (Join-Path $BinDir "..") }
$RunDir = Join-Path $Root ".run"
$PidFile = Join-Path $RunDir "octava.pid"
$LogFile = Join-Path $RunDir "octava.log"
$ErrFile = Join-Path $RunDir "octava.err.log"
$TaskName = "Octava"
$Serve = Join-Path $Root "scripts\octava-serve.mjs"

function Say([string]$Text) { Write-Host $Text }
function Fail([string]$Text) { Write-Error "octava: $Text"; exit 1 }

function Need-Root {
  if (-not (Test-Path (Join-Path $Root "package.json"))) {
    Fail "не вижу package.json в $Root"
  }
}

function Get-Node {
  $portable = Join-Path $Root ".runtime\node\node.exe"
  if (Test-Path $portable) { return $portable }
  $cmd = Get-Command node -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  Fail "Node.js не найден. Запустите install.ps1"
}

function Read-Pid {
  if (-not (Test-Path $PidFile)) { return $null }
  $raw = (Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
  $id = 0
  if ([int]::TryParse("$raw", [ref]$id) -and $id -gt 0) { return $id }
  return $null
}

function Pid-Alive([Nullable[int]]$ProcId) {
  if (-not $ProcId) { return $false }
  return [bool](Get-Process -Id $ProcId -ErrorAction SilentlyContinue)
}

function Use-Env {
  $parts = @(
    (Join-Path $Root ".runtime\node"),
    (Join-Path $Root ".runtime\ffmpeg\bin"),
    (Join-Path $Root ".runtime\ffmpeg"),
    (Join-Path $Root "bin"),
    (Join-Path $Root ".runtime\python"),
    (Join-Path $Root ".runtime\python\Scripts")
  ) | Where-Object { Test-Path $_ }
  $env:PATH = ($parts + $env:PATH) -join ";"
  $ytdlp = Join-Path $Root "bin\yt-dlp.exe"
  if (Test-Path $ytdlp) { $env:YT_DLP_PATH = $ytdlp }
  $py = Join-Path $Root ".runtime\python\python.exe"
  if (Test-Path $py) { $env:OCTAVA_PYTHON = $py }
  $env:OCTAVA_HOME = "$Root"
  if (-not $env:OCTAVA_HOST) { $env:OCTAVA_HOST = "0.0.0.0" }
  if (-not $env:OCTAVA_PORT) { $env:OCTAVA_PORT = "8080" }
  $env:NODE_ENV = "production"
}

function Cmd-Start {
  Need-Root
  Use-Env
  $alive = Read-Pid
  if (Pid-Alive $alive) {
    Say "уже работает (pid $alive)"
    return
  }
  New-Item -ItemType Directory -Force -Path $RunDir | Out-Null
  $node = Get-Node
  $proc = Start-Process -FilePath $node -ArgumentList @($Serve) -WorkingDirectory $Root `
    -RedirectStandardOutput $LogFile -RedirectStandardError $ErrFile `
    -WindowStyle Hidden -PassThru
  Set-Content -Path $PidFile -Value $proc.Id -Encoding ASCII
  Start-Sleep -Milliseconds 500
  if (Pid-Alive $proc.Id) {
    Say "запущена в фоне (pid $($proc.Id))"
    Say "http://127.0.0.1:$($env:OCTAVA_PORT)/"
    Say "логи: $LogFile"
  } else {
    Fail "не удалось запустить, смотрите $LogFile и $ErrFile"
  }
}

function Cmd-Stop {
  $procId = Read-Pid
  if (Pid-Alive $procId) {
    & taskkill.exe /PID $procId /T /F 2>$null | Out-Null
    Say "остановлена (pid $procId)"
  } else {
    Say "уже остановлена"
  }
  Remove-Item $PidFile -ErrorAction SilentlyContinue
}

function Cmd-Status {
  $procId = Read-Pid
  if (Pid-Alive $procId) {
    Say "active pid $procId"
    Say "http://127.0.0.1:$(if ($env:OCTAVA_PORT) { $env:OCTAVA_PORT } else { '8080' })/"
    Say "log $LogFile"
  } else {
    Say "inactive"
    exit 3
  }
}

function Cmd-Logs {
  New-Item -ItemType Directory -Force -Path $RunDir | Out-Null
  if (-not (Test-Path $LogFile)) { New-Item -ItemType File -Path $LogFile | Out-Null }
  Say "файл: $LogFile"
  Get-Content -Path $LogFile, $ErrFile -ErrorAction SilentlyContinue -Tail 80 -Wait
}

function Cmd-Enable {
  Need-Root
  $cmd = "powershell.exe"
  $args = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$BinDir\octava.ps1`" start"
  schtasks.exe /Create /TN $TaskName /TR "$cmd $args" /SC ONLOGON /RL LIMITED /F | Out-Null
  Say "автозапуск включён (планировщик задач: $TaskName)"
  Cmd-Start
}

function Cmd-Disable {
  Cmd-Stop
  schtasks.exe /Delete /TN $TaskName /F 2>$null | Out-Null
  Say "автозапуск выключен"
}

function Cmd-Help {
  @"
Octava — служба загрузчика YouTube (Windows)

  octava.cmd start      запустить в фоне
  octava.cmd stop       остановить
  octava.cmd restart    перезапустить
  octava.cmd status     состояние
  octava.cmd logs       журнал
  octava.cmd enable     автозапуск при входе в Windows + старт
  octava.cmd disable    выключить автозапуск и остановить

После установки слушает порт 8080.
OCTAVA_PORT / OCTAVA_HOST можно задать в окружении.
"@ | Write-Host
}

switch ($Command.ToLowerInvariant()) {
  "start" { Cmd-Start }
  "stop" { Cmd-Stop }
  "restart" { Cmd-Stop; Cmd-Start }
  "status" { Cmd-Status }
  "logs" { Cmd-Logs }
  "enable" { Cmd-Enable }
  "disable" { Cmd-Disable }
  "setup" { Need-Root; Say "готово: $Root" }
  "help" { Cmd-Help }
  "-h" { Cmd-Help }
  "--help" { Cmd-Help }
  default {
    Write-Host "octava: неизвестная команда: $Command"
    Cmd-Help
    exit 2
  }
}
