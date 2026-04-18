$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$sessionDir = Join-Path $repoRoot ".dev-sessions"
$pidFiles = @(
    Join-Path $sessionDir "backend-window.pid",
    Join-Path $sessionDir "frontend-window.pid"
)

if (-not (Test-Path $sessionDir)) {
    Write-Host "No tracked dev session found. If you started services inside VS Code tasks, use 'Tasks: Terminate Task' or 'Tasks: Terminate All Tasks' in VS Code." -ForegroundColor Yellow
    exit 0
}

$stoppedAny = $false

foreach ($pidFile in $pidFiles) {
    if (-not (Test-Path $pidFile)) {
        continue
    }

    $rawPid = (Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
    if (-not $rawPid) {
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
        continue
    }

    $processId = 0
    if (-not [int]::TryParse($rawPid, [ref]$processId)) {
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
        continue
    }

    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "Stopping process $processId ($($process.ProcessName))" -ForegroundColor Cyan
        Stop-Process -Id $processId -Force
        $stoppedAny = $true
    }

    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

if (-not $stoppedAny) {
    Write-Host "No active start-dev PowerShell windows were found." -ForegroundColor Yellow
} else {
    Write-Host "Stopped the tracked backend and frontend dev windows." -ForegroundColor Green
}

if (Test-Path $sessionDir) {
    $remaining = Get-ChildItem -Path $sessionDir -Force -ErrorAction SilentlyContinue
    if (-not $remaining) {
        Remove-Item $sessionDir -Force -ErrorAction SilentlyContinue
    }
}
