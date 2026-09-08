# 把 CompanyAPP clone 到你指定的本機路徑
#
# 預設路徑（可改）:
#   C:\C_projects\01_CompanyAPP
#
# 用法:
#   1) 直接用預設路徑:
#      powershell -ExecutionPolicy Bypass -File .\clone-to-local.ps1
#
#   2) 指定其他路徑:
#      powershell -ExecutionPolicy Bypass -File .\clone-to-local.ps1 -TargetPath "D:\Dev\CompanyAPP"

param(
    [string]$TargetPath = "C:\C_projects\01_CompanyAPP",
    [string]$RepoUrl = "https://github.com/sachiellu/CompanyAPP.git",
    [string]$Branch = "cursor/local-dev-setup-1b50"
)

$ErrorActionPreference = "Stop"

Write-Host "=== CompanyAPP Clone 設定 ===" -ForegroundColor Cyan
Write-Host "目標路徑: $TargetPath"
Write-Host "Repo:     $RepoUrl"
Write-Host "分支:     $Branch"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "找不到 git，請先安裝 Git for Windows。" -ForegroundColor Red
    exit 1
}

$parent = Split-Path -Parent $TargetPath
if (-not (Test-Path $parent)) {
    Write-Host "建立上層資料夾: $parent" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
}

if (Test-Path (Join-Path $TargetPath ".git")) {
    Write-Host "`n目標資料夾已是 Git repo，改為拉取最新..." -ForegroundColor Yellow
    Set-Location $TargetPath
    git remote set-url origin $RepoUrl
    git fetch origin
    git checkout $Branch
    git pull origin $Branch
}
elseif (Test-Path $TargetPath) {
    Write-Host "目標路徑已存在但不是 Git repo: $TargetPath" -ForegroundColor Red
    Write-Host "請換一個空資料夾，或手動清掉後再執行。" -ForegroundColor Yellow
    exit 1
}
else {
    Write-Host "`n開始 clone 到: $TargetPath" -ForegroundColor Cyan
    git clone --branch $Branch $RepoUrl $TargetPath
    Set-Location $TargetPath
}

Write-Host "`nClone 完成。接著執行本機套件安裝..." -ForegroundColor Green
if (Test-Path ".\setup-local.ps1") {
    & ".\setup-local.ps1"
}
else {
    Write-Host "找不到 setup-local.ps1，請手動執行依賴安裝。" -ForegroundColor Yellow
}

Write-Host @"

你的本機專案位置已固定為:
  $TargetPath

之後請都在這個資料夾操作:
  cd $TargetPath
  git pull
  # 後端: cd CompanyAPP; dotnet run
  # 前端: cd company-frontend; npm run dev

"@ -ForegroundColor Yellow
