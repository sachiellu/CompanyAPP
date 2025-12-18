# 1. 建置階段 (使用標準 .NET 9 SDK)
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# 先複製 csproj 並還原，利用 Docker 快取加速部署
COPY ["CompanyAPP.csproj", "./"]
RUN dotnet restore "CompanyAPP.csproj"

# 再複製其餘程式碼進行編譯
COPY . .
WORKDIR "/src/."
RUN dotnet build "CompanyAPP.csproj" -c Release -o /app/build

# 發布
FROM build AS publish
RUN dotnet publish "CompanyAPP.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. 執行階段 (使用標準 Runtime，確保 SQLite 穩定)
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# 設定 Port (Fly.io 預設使用 8080)
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "CompanyAPP.dll"]