## [v3.0] - 架構現代化：React + Web API 轉型 (Current)
本次更新架構升級，將原有的單體 MVC 架構拆分為前後端分離架構，顯著提升開發效率與資安等級。

### 核心變動
- **前端重構：** 全面遷移至 React 19 + Vite + TypeScript。使用 Bootstrap 5 進行 UI 現代化。
- **資安升級 (HttpOnly Cookie)：** 廢棄傳統 localStorage 儲存 Token 做法，改採 HttpOnly Cookie 傳輸 JWT，徹底杜絕 XSS 攻擊。
- **邀請制註冊流：** 實作管理員預創帳號、自動發送 Email 邀請連結、註冊自動綁定員工檔案之完整閉環。
- **數據清洗機制：** 強化 Excel 匯入邏輯，支援「髒資料追蹤回報」，匯入失敗時會回傳精確的行號與原因。

## 技術架構 (Tech Stack v3.0)

### 前端實作 (Frontend)
- **Framework:** React 19 (最新版本)
- **Build Tool:** Vite (Rolldown-based 快速開發環境)
- **Language:** TypeScript (強型別開發)
- **Styling:** Bootstrap 5.3 + Bootstrap Icons
- **HTTP Client:** Axios (實作 withCredentials 跨域憑據傳輸)
- **Data Visualization:** Chart.js + react-chartjs-2

### 後端實作 (Backend)
- **Framework:** .NET 9.0 Web API
- **Database:** SQLite (Entity Framework Core 9.0 Code First)
- **Security:** ASP.NET Core Identity (資安加固)
- **Auth:** JWT Token (實作 HttpOnly Cookie 安全傳輸模式)
- **Excel Logic:** ClosedXML (支援大數據匯出與髒資料分析匯入)

### 部署與架構說明
本專案採用「前後端整合部署」模式：
1. 前端透過 `npm run build` 產生編譯後的靜態檔案。
2. 靜態檔案託管於 .NET 的 `wwwroot` 資料夾。
3. 由 .NET 9 統一處理 API 請求與網頁路由，大幅節省雲端伺服器 (Fly.io) 記憶體資源。