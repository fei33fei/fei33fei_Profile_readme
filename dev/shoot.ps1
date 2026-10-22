# 用无头 Edge / Chrome 在指定视口截图（真实视口，不是缩放 iframe）
# 用法： pwsh -File dev/shoot.ps1 -Path "/" -W 1440 -H 900 -Out "dev/shots/home-1440.png"
param(
  [string]$Path = "/",
  [int]$W = 1440,
  [int]$H = 900,
  [string]$Out = "dev/shots/shot.png",
  [int]$Delay = 3500,
  [string]$Full = ""
)

$ErrorActionPreference = 'Stop'
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
  $outDir = Split-Path -Parent $Out
  if ($outDir -and -not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
  $url = "http://127.0.0.1:4173$Path"
  $profileDir = Join-Path $env:TEMP ("edge-shot-" + [guid]::NewGuid().ToString("N"))
  $args = @(
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
    "--no-default-browser-check", "--disable-extensions", "--force-device-scale-factor=1",
    "--run-all-compositor-stages-before-draw",
    "--user-data-dir=$profileDir",
    "--window-size=$W,$H",
    "--virtual-time-budget=$Delay",
    "--screenshot=$Out",
    $url
  )
  $ErrorActionPreference = 'Continue'
  & $edge @args 2>&1 | Out-Null
  $ErrorActionPreference = 'Stop'
  if (Test-Path $Out) {
    $len = (Get-Item $Out).Length
    Write-Output "OK  $Out  ($W x $H)  $len bytes"
  } else {
    Write-Output "FAIL $Out"
  }
  Remove-Item -Recurse -Force $profileDir -ErrorAction SilentlyContinue
} finally {
  Pop-Location
}
