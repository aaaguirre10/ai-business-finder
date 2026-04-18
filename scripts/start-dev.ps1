$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$backendScript = Join-Path $scriptDir "start-backend.ps1"
$frontendScript = Join-Path $scriptDir "start-frontend.ps1"
$sessionDir = Join-Path $repoRoot ".dev-sessions"
$backendPidFile = Join-Path $sessionDir "backend-window.pid"
$frontendPidFile = Join-Path $sessionDir "frontend-window.pid"

$powerShellExe = if (Get-Command pwsh -ErrorAction SilentlyContinue) {
    "pwsh"
} else {
    "powershell.exe"
}

Write-Host "Opening backend and frontend in separate PowerShell windows..." -ForegroundColor Cyan

New-Item -ItemType Directory -Force -Path $sessionDir | Out-Null

$backendProcess = Start-Process -FilePath $powerShellExe -PassThru -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-File", $backendScript
)

$frontendProcess = Start-Process -FilePath $powerShellExe -PassThru -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-File", $frontendScript
)

Set-Content -Path $backendPidFile -Value $backendProcess.Id
Set-Content -Path $frontendPidFile -Value $frontendProcess.Id

Write-Host "Backend window PID: $($backendProcess.Id)" -ForegroundColor DarkGray
Write-Host "Frontend window PID: $($frontendProcess.Id)" -ForegroundColor DarkGray
Write-Host "Run .\scripts\stop-dev.ps1 later if you want to close both tracked windows." -ForegroundColor Green
