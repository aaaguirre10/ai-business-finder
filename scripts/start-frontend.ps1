$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$frontendDir = Join-Path $repoRoot "frontend"
$nodeModulesDir = Join-Path $frontendDir "node_modules"
$envFile = Join-Path $frontendDir ".env"

Write-Host "Starting frontend from $frontendDir" -ForegroundColor Cyan

if (-not (Test-Path $frontendDir)) {
    Write-Error "Frontend directory not found: $frontendDir"
}

if (-not (Test-Path $nodeModulesDir)) {
    Write-Host "Frontend dependencies are not installed yet." -ForegroundColor Yellow
    Write-Host "Run this first:" -ForegroundColor Yellow
    Write-Host "  cd `"$frontendDir`"" -ForegroundColor Yellow
    Write-Host "  npm.cmd install" -ForegroundColor Yellow
    Read-Host "Press Enter to close"
    exit 1
}

if (-not (Test-Path $envFile)) {
    Write-Host "Frontend .env file not found." -ForegroundColor Yellow
    Write-Host "Copy frontend\.env.example to frontend\.env first." -ForegroundColor Yellow
    Read-Host "Press Enter to close"
    exit 1
}

Set-Location $frontendDir
& npm.cmd run dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend process exited with code $LASTEXITCODE." -ForegroundColor Red
    Read-Host "Press Enter to close"
}
