$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$backendDir = Join-Path $repoRoot "backend"
$venvPython = Join-Path $backendDir ".venv\Scripts\python.exe"
$envFile = Join-Path $backendDir ".env"

Write-Host "Starting backend from $backendDir" -ForegroundColor Cyan

if (-not (Test-Path $backendDir)) {
    Write-Error "Backend directory not found: $backendDir"
}

if (-not (Test-Path $venvPython)) {
    Write-Host "Backend virtual environment not found." -ForegroundColor Yellow
    Write-Host "Create it with:" -ForegroundColor Yellow
    Write-Host "  cd `"$backendDir`"" -ForegroundColor Yellow
    Write-Host "  python -m venv .venv" -ForegroundColor Yellow
    Write-Host "  .\.venv\Scripts\Activate" -ForegroundColor Yellow
    Write-Host "  pip install -r requirements.txt" -ForegroundColor Yellow
    Read-Host "Press Enter to close"
    exit 1
}

if (-not (Test-Path $envFile)) {
    Write-Host "Backend .env file not found." -ForegroundColor Yellow
    Write-Host "Copy backend\.env.example to backend\.env and add your Google key first." -ForegroundColor Yellow
    Read-Host "Press Enter to close"
    exit 1
}

Set-Location $backendDir
& $venvPython -m uvicorn app.main:app --reload

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend process exited with code $LASTEXITCODE." -ForegroundColor Red
    Read-Host "Press Enter to close"
}
