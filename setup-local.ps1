# 本機開發一鍵設定（Windows PowerShell）
# 使用方式：在專案根目錄執行 .\setup-local.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $Root

Write-Host "=== CompanyAPP 本機環境設定 ===" -ForegroundColor Cyan
Write-Host "專案根目錄: $Root"

function Assert-Command($Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Host "找不到指令: $Name" -ForegroundColor Red
        Write-Host "請先安裝後再執行此腳本。" -ForegroundColor Yellow
        exit 1
    }
}

Assert-Command "dotnet"
Assert-Command "node"
Assert-Command "npm"

Write-Host "`n[1/4] 信任本機 HTTPS 開發憑證..." -ForegroundColor Cyan
dotnet dev-certs https --trust | Out-Host

Write-Host "`n[2/4] 還原 .NET 套件..." -ForegroundColor Cyan
dotnet restore "$Root\CompanyAPP.sln"

Write-Host "`n[3/4] 安裝前端套件..." -ForegroundColor Cyan
Set-Location "$Root\company-frontend"
npm install

Write-Host "`n[4/4] 完成" -ForegroundColor Green
Set-Location $Root

Write-Host @"

接下來請開兩個終端機：

  終端機 1（後端）:
    cd CompanyAPP
    dotnet run

  終端機 2（前端）:
    cd company-frontend
    npm run dev

然後開啟: http://localhost:5173
預設管理員: admin@default.com / Admin123!

之後若要同步最新程式碼:
    git pull origin main

"@ -ForegroundColor Yellow
