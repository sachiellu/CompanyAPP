# Get the root directory where the script is located
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $PSScriptRoot

Write-Host ">>> Root Directory: $PSScriptRoot" -ForegroundColor Yellow

# 1. Build Frontend
Write-Host ">>> [1/3] Building frontend..." -ForegroundColor Cyan
if (Test-Path "company-frontend") {
    cd company-frontend
    npm run build
} else {
    Write-Host "!!! Error: company-frontend directory not found." -ForegroundColor Red
    pause
    exit
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "!!! Error: npm build failed." -ForegroundColor Red
    pause
    exit
}

# 2. Clean backend wwwroot
Write-Host ">>> [2/3] Cleaning wwwroot..." -ForegroundColor Cyan
cd $PSScriptRoot
$wwwroot = "CompanyAPP/wwwroot"

if (Test-Path $wwwroot) {
    Remove-Item -Recurse -Force "$wwwroot/*" -ErrorAction SilentlyContinue
} else {
    New-Item -ItemType Directory -Path $wwwroot
}

# 3. Sync files
Write-Host ">>> [3/3] Syncing dist to wwwroot..." -ForegroundColor Cyan
if (Test-Path "company-frontend/dist") {
    Copy-Item -Path "company-frontend/dist/*" -Destination $wwwroot -Recurse -Force
    Write-Host "-------------------------------------------" -ForegroundColor Green
    Write-Host "SUCCESS: Deployment files updated." -ForegroundColor Green
} else {
    Write-Host "!!! Error: dist directory not found." -ForegroundColor Red
}

Write-Host "Ready for 'dotnet run' or 'fly deploy'." -ForegroundColor Green
Write-Host "-------------------------------------------" -ForegroundColor Green

pause