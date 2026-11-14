# 正式映像：先用 Node 22 編譯 SPA，再交給 .NET 9 發布。
# 建置必須從 repo 根目錄開始（Fly / CI 皆然），本機不必裝 Docker Desktop。

FROM node:22-bookworm-slim AS frontend
WORKDIR /frontend
COPY company-frontend/package.json company-frontend/package-lock.json ./
RUN npm ci
COPY company-frontend/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY CompanyAPP/CompanyAPP.csproj ./
RUN dotnet restore "CompanyAPP.csproj"
COPY CompanyAPP/ ./
COPY --from=frontend /frontend/dist ./wwwroot
RUN dotnet publish "CompanyAPP.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "CompanyAPP.dll"]
