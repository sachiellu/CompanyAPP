.PHONY: setup setup-frontend build test lint run run-frontend

# 1. 初始化後端環境
setup:
	dotnet restore CompanyAPP.sln
	dotnet dev-certs https --trust || true

# 1b. 初始化前端環境
setup-frontend:
	cd company-frontend && npm install

# 2. 編譯專案
build:
	dotnet build CompanyAPP.sln

# 3. 跑單元測試
test:
	dotnet test CompanyAPP.sln

# 4. 格式檢查
lint:
	dotnet format CompanyAPP.sln --verify-no-changes || dotnet format CompanyAPP.sln

# 5. 啟動後端 API（HTTPS http://localhost:5203）
run:
	dotnet run --project CompanyAPP/CompanyAPP.csproj

# 6. 啟動前端 Vite
run-frontend:
	cd company-frontend && npm run dev

# 7. 執行 API 測試
api-test:
	dotnet test CompanyAPP.sln --filter FullyQualifiedName~Controller

# 8. 執行套件弱點掃描
security:
	dotnet list CompanyAPP.sln package --vulnerable
