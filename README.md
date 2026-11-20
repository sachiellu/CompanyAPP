# CompanyAPP

內部用的企業資源管理，模組包含廠商、員工、任務派工、帳號與操作稽核。前端 React 19 + TypeScript（Vite、Bootstrap 5、Axios、Chart.js），後端 ASP.NET Core .NET 9 Web API，資料 SQLite + EF Core。帳號用 Identity（角色、鎖定），登入 JWT 放 HttpOnly Cookie。原本是 MVC，拆開後的舊碼在 `v2.3-mvc`。

正式站：https://companyapp-luyu.fly.dev  
測試站：https://companyapp-qa.fly.dev

## 系統裡有什麼

- **儀表板：** 登入後的首頁，圖表看廠商／員工等概況。
- **廠商：** 建檔、編輯、詳情、Logo 上傳；管理員可匯出已勾選的資料。
- **員工：** 建檔、編輯、詳情；管理員可寄邀請信開通帳號、Excel 匯入／匯出。匯入某一列失敗會帶回行號和原因，其他列照寫。匯出沒勾選不會整包匯出。
- **任務派工：** 建立、指派、狀態與截止日期。
- **帳號與權限：** 管理員／一般員工。儀表板與各模組需登入；開通只能走邀請連結，不能自行註冊。
- **稽核：** 重要操作會記一筆，給管理員查。
- **畫面：** 小螢幕側欄改收合，登入和表單有對窄寬度調整。

寄信用 Brevo。沒設定或寄失敗會回錯誤，畫面不會假裝成功。正式站 JWT 簽名金鑰放 Fly secrets，不進程式庫。

## 本機開發設定

以本機為主、Git 同步為準。

### 前置需求

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 22 LTS](https://nodejs.org/)（`npm run dev` 與上線編前端都用；至少 20.19）
- Git

### Clone

```powershell
git clone -b main https://github.com/sachiellu/CompanyAPP.git
cd CompanyAPP
.\setup-local.ps1
```

資料夾裡已經有 repo 的話：

```powershell
git fetch origin
git checkout main
git pull origin main
.\setup-local.ps1
```

### 手動設定

```bash
# 登入 Cookie 需要本機 HTTPS
dotnet dev-certs https --trust

dotnet restore CompanyAPP.sln

cd company-frontend
npm install
```

### 日常啟動（兩個終端機）

```powershell
# 後端 API → https://localhost:5203
cd CompanyAPP
dotnet run

# 前端 → http://localhost:5173
cd company-frontend
npm run dev
```

瀏覽器開 http://localhost:5173。登入頁有一鍵展示登入（管理員／一般員工），不需輸入密碼。

### 測試

```powershell
dotnet test CompanyAPP.sln
cd company-frontend
npm run lint
```

## 技術架構

### 前端

- React 19、TypeScript、Vite
- Bootstrap 5.3、Bootstrap Icons
- Axios（withCredentials，才能帶 Cookie）
- Chart.js

### 後端

- .NET 9 Web API
- EF Core 9、SQLite（正式／測試站資料放 Fly volume）
- ASP.NET Core Identity（角色；畫面不走 Razor Pages）
- JWT + HttpOnly Cookie
- ClosedXML（Excel）
- Brevo（邀請信）

### 上線

映像只有根目錄 `Dockerfile`：Node 22 編前端，再 `dotnet publish` 塞進 wwwroot。Push `main` 之後 GitHub Actions 先編譯測試，再依序部署測試站與正式站（同一份程式，正式站不因測試站失敗而跳過）。SonarCloud 另開平行工作。本機開發不用裝 Docker Desktop。建置要在 repo 最外層，才能複製 `company-frontend`，不要進 `CompanyAPP/` 單獨 deploy：

```text
flyctl deploy . --config CompanyAPP/fly.toml --dockerfile ./Dockerfile --remote-only
```

## 版本

舊 MVC：tag `v2.3-mvc`，branch `feature/react-modernization`。

### v3.0 前後端拆開

從單體 MVC 改成 React 對 Web API。登入改 JWT Cookie，不再把 token 放 localStorage。註冊改邀請制。Excel 匯入失敗會帶回行號和原因。

### v3.1 接回測試與雲端（目前主線）

架構仍是 v3.0。把 `dotnet test`、SonarCloud、Fly 測試站／正式站接回 GitHub Actions。任務詳情在截止日期缺失時不再白屏。開通必須從邀請信進來。登出會清 Cookie，儀表板未登入進不去。金鑰移出程式庫。拿掉沒用到的 Razor Identity 頁、登入草稿、GitLab CI。小螢幕側欄、登入和表單有再調。匯出改為必須勾選。上線改認根目錄 Dockerfile，避免誤用子資料夾舊檔。
