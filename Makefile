.PHONY: setup build test lint run

# 1. 初始化環境
setup:
	dotnet restore CompanyAPP/CompanyAPP.sln

# 2. 編譯專案
build:
	dotnet build CompanyAPP/CompanyAPP.sln

# 3. 跑單元測試 (執行你既有的測試專案)
test:
	dotnet test CompanyAPP/CompanyAPP.sln

# 4. 格式檢查
lint:
	dotnet format CompanyAPP/CompanyAPP.sln

# 5. 啟動後端 API
run:
	dotnet run --project CompanyAPP/CompanyAPP/CompanyAPP.csproj