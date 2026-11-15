# 企業資源管理（CompanyAPP）

內部用的廠商、員工與任務派工系統。瀏覽器畫面是 React，資料與權限走 ASP.NET Core Web API；上線時打成一份映像，由 GitHub 推送主線後自動測試並佈到 Fly。

- 正式站：https://companyapp-luyu.fly.dev
- 測試站：https://companyapp-qa.fly.dev

先前 MVC 版本見 tag `v2.3-mvc`。

## 架構

| 層 | 做法 |
|---|---|
| 畫面 | React 19、TypeScript、Vite、Bootstrap 5 |
| API | .NET 9 Web API、Entity Framework Core、SQLite |
| 帳號 | ASP.NET Core Identity（鎖定、角色）；畫面不使用 Razor Identity |
| 登入 | JWT 寫在 HttpOnly Cookie，前端不以 localStorage 當憑證；正式站簽章金鑰放在 Fly 機密，不進程式庫 |
| 註冊 | 管理員建立員工後寄邀請信，從信件連結開通並綁定員工檔 |
| 匯入 | 員工 Excel（ClosedXML）；失敗列回傳行號與原因，不整檔中止 |
| 匯出 | 廠商／員工 Excel；必須先勾選，未勾選不匯出全部 |

本機開發用兩個行程（熱重載）。雲端只用根目錄 `Dockerfile`：先以 Node 22 編譯前端，再 .NET 9 發布，把編譯結果放進網站靜態目錄。本機不必安裝 Docker Desktop。

## 本機開發

需要 .NET 9 SDK、[Node.js 22 LTS](https://nodejs.org/)（至少 20.19）、Git。

```powershell
git clone -b main https://github.com/sachiellu/CompanyAPP.git
cd CompanyAPP
.\setup-local.ps1
```

已有資料夾時：`git pull origin main` 後再跑 `.\setup-local.ps1`。

兩個終端機：

```powershell
# 後端 https://localhost:5203
cd CompanyAPP
dotnet run

# 前端 http://localhost:5173
cd company-frontend
npm run dev
```

瀏覽器開 http://localhost:5173。示範帳號只在 Development 種子資料，見 `SeedData`。登入 Cookie 需要本機 HTTPS 憑證：`dotnet dev-certs https --trust`。

## 測試與上線

```powershell
dotnet test CompanyAPP.sln
cd company-frontend
npm run lint
```

推送到 `main` 後，GitHub Actions 會依序：編譯與測試 → SonarCloud → 佈測試站 → 佈正式站。任一步失敗不會略過。映像在 Fly 遠端建置，指令等同：

```text
flyctl deploy . --config CompanyAPP/fly.toml --dockerfile ./Dockerfile --remote-only
```

建置情境是 repo 根目錄，才能複製 `company-frontend`。不要在 `CompanyAPP/` 子資料夾單獨部署。
