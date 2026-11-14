## 本機開發設定

以本機為主、Git 同步為準。

### 前置需求
- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 22 LTS](https://nodejs.org/)（本機 `npm run dev` 用；至少 20.19）
- Git

### Clone
```powershell
git clone -b main https://github.com/sachiellu/CompanyAPP.git
cd CompanyAPP
.\setup-local.ps1
```

若資料夾已經有 repo：
```powershell
git fetch origin
git checkout main
git pull origin main
.\setup-local.ps1
```

### 手動設定
```bash
# 信任本機 HTTPS 憑證（登入 Cookie 需要 HTTPS）
dotnet dev-certs https --trust

# 後端
dotnet restore CompanyAPP.sln

# 前端
cd company-frontend
npm install
```

### 日常啟動（開兩個終端機）
```powershell
# 終端機 1：後端 API → https://localhost:5203
cd CompanyAPP
dotnet run

# 終端機 2：前端 → http://localhost:5173
cd company-frontend
npm run dev
```
瀏覽器開啟：http://localhost:5173  
預設管理員：`admin@default.com` / `Admin123!`

### 日常 Git 同步
```powershell
git pull
git add .
git commit -m "你的說明"
git push
```
---

## [v3.0] - 架構現代化：React + Web API 轉型
本次更新將原有的單體 MVC 架構拆為前後端分離。

### 核心變動
- **前端：** 遷移至 React 19 + Vite + TypeScript，畫面使用 Bootstrap 5。
- **登入：** JWT 改走 HttpOnly Cookie，不再把 Token 放進 localStorage。
- **邀請制註冊：** 管理員預建員工、寄邀請信、從連結開通並綁定員工檔。
- **Excel：** 匯入失敗會回傳行號與原因。

## 技術架構 (Tech Stack v3.0)

### 前端 (Frontend)
- **Framework:** React 19
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Bootstrap 5.3 + Bootstrap Icons
- **HTTP Client:** Axios（withCredentials）
- **Data Visualization:** Chart.js + react-chartjs-2

### 後端 (Backend)
- **Framework:** .NET 9.0 Web API
- **Database:** SQLite（Entity Framework Core 9.0）
- **帳號：** ASP.NET Core Identity（使用者與角色；畫面不走 Razor Pages）
- **Auth:** JWT + HttpOnly Cookie
- **Excel:** ClosedXML

### 部署
推上 `main` 後，Fly 遠端用根目錄 `Dockerfile` 建置：Node 22 編譯前端，再打包進 .NET 9。本機不必裝 Docker Desktop。

本機開發（熱重載）開兩個終端機：`dotnet run` 與 `npm run dev`，瀏覽器開 http://localhost:5173。
測試：`dotnet test CompanyAPP.sln`；前端檢查：`cd company-frontend` 後 `npm run lint`。

舊版 MVC 請看 tag `v2.3-mvc` 或 branch `feature/react-modernization`。

---

## [v3.1] - 2026-11 專案重新啟動 (Current)
v3.0 架構不變。這次把測試與雲端部署接回來，並精簡主線上不再使用的檔案。

### 這次修正
- 接回自動化測試、程式品質分析，以及 QA／正式站部署。
- 修好正式站任務詳情打不開的問題。
- 帳號開通改為必須從邀請信進入。
- 登出會真正結束登入；儀表板需登入才能看。
- 金鑰不再放進程式庫。
- 精簡主線：移除未使用的 Razor Identity 頁、登入畫面草稿、GitLab CI，以及重複的方案／工作流程檔。登入與註冊改為小螢幕置中。

### 環境
- QA：https://companyapp-qa.fly.dev
- 正式站：https://companyapp-luyu.fly.dev
