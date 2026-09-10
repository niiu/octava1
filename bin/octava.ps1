param(
  [Parameter(Position = 0)]
  [string]$Command = "help",
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Rest
)

$ErrorActionPreference = "Stop"
$BinDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = if ($env:OCTAVA_HOME) { $env:OCTAVA_HOME } else { (Resolve-Path (Join-Path $BinDir "..")).Path }
$RunDir = Join-Path $Root ".run"
$PidFile = Join-Path $RunDir "octava.pid"
$PortFile = Join-Path $RunDir "octava.port"
$WantedPortFile = Join-Path $RunDir "octava.wanted-port"
$LogFile = Join-Path $RunDir "octava.log"
$ErrFile = Join-Path $RunDir "octava.err.log"
$TaskName = "Octava"
$Serve = Join-Path $Root "scripts\octava-serve.mjs"
$WinDir = if ($env:WINDIR) { $env:WINDIR } else { "C:\Windows" }
$System32 = Join-Path $WinDir "System32"
$SchTasks = Join-Path $System32 "schtasks.exe"
$TaskKill = Join-Path $System32 "taskkill.exe"

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

function Parse-PortArg {
  if (-not $Rest) { return 0 }
  for ($i = 0; $i -lt $Rest.Count; $i++) {
    $item = [string]$Rest[$i]
    if ($item -match '^(--port|-p)$' -and ($i + 1) -lt $Rest.Count) {
      $n = 0
      if ([int]::TryParse([string]$Rest[$i + 1], [ref]$n) -and $n -gt 0 -and $n -lt 65536) { return $n }
    }
    if ($item -match '^--port=(\d+)$') {
      $n = [int]$Matches[1]
      if ($n -gt 0 -and $n -lt 65536) { return $n }
    }
    if ($item -match '^\d+$') {
      $n = [int]$item
      if ($n -gt 0 -and $n -lt 65536) { return $n }
    }
  }
  return 0
}

function Read-WantedPort {
  if (-not (Test-Path $WantedPortFile)) { return 0 }
  $raw = (Get-Content $WantedPortFile -ErrorAction SilentlyContinue | Select-Object -First 1)
  $n = 0
  if ([int]::TryParse("$raw", [ref]$n) -and $n -gt 0 -and $n -lt 65536) { return $n }
  return 0
}

function Save-WantedPort([int]$Port) {
  New-Item -ItemType Directory -Force -Path $RunDir | Out-Null
  Set-Content -Path $WantedPortFile -Value "$Port" -Encoding ASCII
}

function Apply-PortEnv {
  $n = Parse-PortArg
  if ($n -le 0) { $n = Read-WantedPort }
  if ($n -le 0 -and $env:OCTAVA_PORT) {
    $tmp = 0
    if ([int]::TryParse("$($env:OCTAVA_PORT)", [ref]$tmp) -and $tmp -gt 0) { $n = $tmp }
  }
  if ($n -gt 0) {
    Save-WantedPort $n
    $env:OCTAVA_PORT = "$n"
    $env:OCTAVA_PORT_STRICT = "1"
    return $n
  }
  return 0
}

function Read-Port {
  if (Test-Path $PortFile) {
    $raw = (Get-Content $PortFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    $n = 0
    if ([int]::TryParse("$raw", [ref]$n) -and $n -gt 0) { return $n }
  }
  $wanted = Read-WantedPort
  if ($wanted -gt 0) { return $wanted }
  if ($env:OCTAVA_PORT) { return $env:OCTAVA_PORT }
  return 8080
}

function Pid-Alive([Nullable[int]]$ProcId) {
  if (-not $ProcId) { return $false }
  return [bool](Get-Process -Id $ProcId -ErrorAction SilentlyContinue)
}

function Use-Env {
  $parts = @(
    $System32,
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
  if (-not $env:OCTAVA_HOST) { $env:OCTAVA_HOST = "127.0.0.1" }
  $env:NODE_ENV = "production"
}

function Test-Listen([int]$Port) {
  if ($Port -le 0) { return $false }
  $client = $null
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $iar = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    $wait = $iar.AsyncWaitHandle.WaitOne(400, $false)
    if ($wait -and $client.Connected) { return $true }
  } catch {
    return $false
  } finally {
    if ($client) { try { $client.Close() } catch {} }
  }
  return $false
}

function Dump-Log {
  if (Test-Path $LogFile) {
    $tail = Get-Content $LogFile -ErrorAction SilentlyContinue | Select-Object -Last 40
    if ($tail) { Write-Host ($tail -join "`n") }
  }
}
  Need-Root
  Use-Env
  $wanted = Apply-PortEnv
  $alive = Read-Pid
  if (Pid-Alive $alive) {
    $current = 0
    [void][int]::TryParse("$(Read-Port)", [ref]$current)
    if ($wanted -gt 0 -and $current -ne $wanted) {
      Say "меняю порт $current -> $wanted"
      Cmd-Stop
    } else {
      Say "уже работает (pid $alive)"
      Say "http://127.0.0.1:$(Read-Port)/"
      return
    }
  }
  New-Item -ItemType Directory -Force -Path $RunDir | Out-Null
  $node = Get-Node
  $launch = Join-Path $RunDir "launch.cmd"
  $lines = @(
    "@echo off",
    "cd /d `"$Root`"",
    "set NODE_ENV=production",
    "set OCTAVA_HOME=$Root",
    "set OCTAVA_HOST=$($env:OCTAVA_HOST)",
    "set OCTAVA_PORT=$($env:OCTAVA_PORT)",
    "set OCTAVA_PORT_STRICT=$($env:OCTAVA_PORT_STRICT)",
    "set OCTAVA_PYTHON=$($env:OCTAVA_PYTHON)",
    "set FFMPEG_PATH=$($env:FFMPEG_PATH)",
    "`"$node`" --trace-uncaught `"$Serve`" >> `"$LogFile`" 2>&1"
  )
  Set-Content -Path $launch -Value $lines -Encoding ASCII
  $comspec = Join-Path $System32 "cmd.exe"
  if (-not (Test-Path $comspec)) { $comspec = $env:ComSpec }
  if (-not $comspec) { $comspec = "cmd.exe" }
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $comspec
  $psi.Arguments = "/c `"$launch`""
  $psi.WorkingDirectory = "$Root"
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $proc = New-Object System.Diagnostics.Process
  $proc.StartInfo = $psi
  if (-not $proc.Start()) { Fail "не удалось создать процесс cmd" }
  Set-Content -Path $PidFile -Value $proc.Id -Encoding ASCII
  $portWanted = 0
  [void][int]::TryParse("$($env:OCTAVA_PORT)", [ref]$portWanted)
  if ($portWanted -le 0) { $portWanted = Read-WantedPort }
  $ready = $false
  $port = $portWanted
  for ($i = 0; $i -lt 80; $i++) {
    Start-Sleep -Milliseconds 250
    $aliveNow = Pid-Alive $proc.Id
    $probe = $portWanted
    if (Test-Path $PortFile) { $probe = Read-Port }
    if ($probe -gt 0 -and (Test-Listen ([int]$probe)) -and $aliveNow) {
      $port = $probe
      $ready = $true
      break
    }
    if (-not $aliveNow -and $i -gt 6) { break }
  }
  if ($ready) {
    Say "запущена в фоне (pid $($proc.Id))"
    Say "http://127.0.0.1:$port/"
    Say "логи: $LogFile"
    return
  }
  Dump-Log
  Fail "не удалось запустить, смотрите $LogFile"
}

function Cmd-Stop {
  $procId = Read-Pid
  if (Pid-Alive $procId) {
    if (Test-Path $TaskKill) {
      & $TaskKill /PID $procId /T /F 2>$null | Out-Null
    } else {
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
    Say "остановлена (pid $procId)"
  } else {
    Say "уже остановлена"
  }
  Remove-Item $PidFile -ErrorAction SilentlyContinue
}

function Cmd-Status {
  $procId = Read-Pid
  $port = Read-Port
  $listen = $false
  if ($port) { $listen = Test-Listen ([int]$port) }
  if ((Pid-Alive $procId) -or $listen) {
    Say "active pid $procId"
    Say "http://127.0.0.1:$port/"
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

function Register-StartupShortcut {
  $startup = [Environment]::GetFolderPath("Startup")
  if (-not $startup) { return $false }
  $lnk = Join-Path $startup "Octava.lnk"
  $shell = New-Object -ComObject WScript.Shell
  $sc = $shell.CreateShortcut($lnk)
  $sc.TargetPath = (Join-Path $WinDir "System32\WindowsPowerShell\v1.0\powershell.exe")
  if (-not (Test-Path $sc.TargetPath)) { $sc.TargetPath = "powershell.exe" }
  $sc.Arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$BinDir\octava.ps1`" start"
  $sc.WorkingDirectory = "$Root"
  $sc.Save()
  return (Test-Path $lnk)
}

function Cmd-Enable {
  Need-Root
  $ok = $false
  if (Test-Path $SchTasks) {
    $ps = Join-Path $WinDir "System32\WindowsPowerShell\v1.0\powershell.exe"
    if (-not (Test-Path $ps)) { $ps = "powershell.exe" }
    $tr = "`"$ps`" -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$BinDir\octava.ps1`" start"
    $null = cmd.exe /c "`"$SchTasks`" /Create /TN $TaskName /TR $tr /SC ONLOGON /RL LIMITED /F >nul 2>&1"
    if ($LASTEXITCODE -eq 0) { $ok = $true }
  }
  if (-not $ok) {
    try { $ok = Register-StartupShortcut } catch { $ok = $false }
    if ($ok) { Say "автозапуск: ярлык в папке Автозагрузка" }
    else { Say "автозапуск не записался — запускайте octava.cmd start вручную" }
  } else {
    Say "автозапуск включён (планировщик задач: $TaskName)"
  }
  Cmd-Start
}

function Cmd-Disable {
  Cmd-Stop
  if (Test-Path $SchTasks) {
    & $SchTasks /Delete /TN $TaskName /F 2>$null | Out-Null
  }
  $startup = [Environment]::GetFolderPath("Startup")
  if ($startup) {
    Remove-Item (Join-Path $startup "Octava.lnk") -ErrorAction SilentlyContinue
  }
  Say "автозапуск выключен"
}

function Cmd-Help {
  @"
Octava — служба загрузчика YouTube (Windows)

  octava.cmd start 8787     запустить на порту 8787
  octava.cmd start --port 8787
  octava.cmd stop       остановить
  octava.cmd restart 8787   перезапустить на порту
  octava.cmd status     состояние
  octava.cmd logs       журнал
  octava.cmd enable 8787    автозапуск + этот порт
  octava.cmd disable    выключить автозапуск и остановить

Порт из команды запоминается в .run\octava.wanted-port.
Llama на 8080: octava.cmd start 8787
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
