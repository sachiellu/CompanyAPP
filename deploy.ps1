# 本機開發請用 npm run dev + dotnet run。
# 正式／QA 畫面由 git push 觸發：Fly 遠端用根目錄 Dockerfile（Node 22 + .NET 9）建置。
$ErrorActionPreference = "Stop"
Write-Host "雲端部署請 git push origin main，不必在本機編 wwwroot。" -ForegroundColor Cyan
Write-Host "本機預覽：" -ForegroundColor Cyan
Write-Host "  cd CompanyAPP; dotnet run"
Write-Host "  cd company-frontend; npm run dev"
Write-Host "瀏覽器開 http://localhost:5173"
Write-Host "測試：dotnet test CompanyAPP.sln"
