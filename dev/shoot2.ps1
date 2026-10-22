# 用 iframe 精确渲染指定视口（headless --window-size 会被 Windows 最小窗口宽度裁剪，所以改用 iframe）
# 用法： pwsh -File dev/shoot2.ps1 -Path "/" -W 1440 -H 900 -Out "dev/shots/x.png"
param(
  [string]$Path = "/",
  [int]$W = 1440,
  [int]$H = 900,
  [string]$Out = "dev/shots/vp.png",
  [int]$Delay = 6000
)

$ErrorActionPreference = 'Stop'
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
  $outDir = Split-Path -Parent $Out
  if ($outDir -and -not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
  $url = "http://127.0.0.1:4173/__dev/vp.html?w=$W&h=$H&p=$([uri]::EscapeDataString($Path))"
  $profileDir = Join-Path $env:TEMP ("vp-" + [guid]::NewGuid().ToString("N"))
  $a = @(
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
    "--no-default-browser-check", "--disable-extensions", "--force-device-scale-factor=1",
    "--run-all-compositor-stages-before-draw",
    "--user-data-dir=$profileDir",
    "--window-size=$($W + 20),$($H + 40)",
    "--virtual-time-budget=$Delay",
    "--screenshot=$Out",
    $url
  )
  $ErrorActionPreference = 'Continue'
  & $edge @a 2>&1 | Out-Null
  $ErrorActionPreference = 'Stop'
  if (Test-Path $Out) {
    Write-Output ("OK  {0}  (vp {1}x{2})  {3} bytes" -f $Out, $W, $H, (Get-Item $Out).Length)
  } else {
    Write-Output "FAIL $Out"
  }
} finally {
  Pop-Location
}
