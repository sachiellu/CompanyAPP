# Software Design Document (SDD)

文件狀態：現行主線（React + ASP.NET Core Web API）  
適用：本 repo 開發、審查、部署時的設計依據。

## 1. 目的

本文件固定系統邊界與模組責任，避免實作時臨時改架構。功能變更先對照本文件；與測試策略衝突時，以 [TDD.md](./TDD.md) 的失敗測試為準，再回頭改設計。

## 2. 系統概述

CompanyAPP 是內部企業資源管理。畫面為 React SPA，業務與資料在 ASP.NET Core。正式環境兩者打成同一映像，由 Fly.io 提供 HTTPS 與 volume 上的 SQLite。

不是純靜態網站：靜態前端只是發佈產物，執行期仍有 API、Identity、資料庫。

## 3. 架構

```text
Browser (React SPA)
    → HTTPS / Cookie
ASP.NET Core (CompanyAPP.dll)
    → JWT (HttpOnly Cookie)
    → EF Core / SQLite
    → Identity (Admin / Manager / User)
    → Brevo（邀請信，可選）
```

本機：Vite `http://localhost:5173` 代理 `/api` 到 `https://localhost:5203`。  
正式：`Dockerfile` 先 `npm run build`，把 `dist` 拷進 `wwwroot`，再 `dotnet publish`。

## 4. 模組

| 模組 | 路徑（前端 / 後端） | 備註 |
|------|---------------------|------|
| Auth | `features/auth` / `Controllers/Api/AuthController` | 登入、登出、邀請開通、展示登入 |
| Companies | `features/companies` / `CompanyService` | 建檔、Logo、匯出 |
| Employees | `features/employees` / `EmployeeService` | 邀請、匯入匯出 |
| Missions | `features/missions` / `MissionService` | 派工 |
| Users | `features/users` / `UsersApiController` | 角色，Admin |
| Audit | `features/audit` / `AuditService` | 業務操作紀錄，Admin |

自動攔截 Identity 內部欄位（密碼雜湊、stamp）不列入稽核畫面。業務列由 `AuditService` 寫入。

## 5. 驗證與授權

- Identity + JWT，token 放 `X-Access-Token` Cookie（HttpOnly、正式環境 Secure）。
- API 以角色授權；SPA 路由依 `userRole` 顯示選單，真正權限以後端為準。
- 開通帳號只能走邀請 token，不可自行註冊。

## 6. 資料

- SQLite；雲端路徑 `DATABASE_PATH`（Fly volume `/data`）。
- 遷移在啟動時 `Database.Migrate()`。
- 示範帳僅供展示；種子更新不應出現在稽核列表。

## 7. 部署

- 唯一映像：repo 根目錄 `Dockerfile`。
- `main` push → GitHub Actions：編譯測試 → SonarCloud（平行）→ 部署 `companyapp-luyu`。
- JWT 金鑰在 Fly secrets，不進程式庫。

## 8. 與 TDD 的協作

1. 變更先看本文件是否要改模組邊界或資料流。  
2. 再依 [TDD.md](./TDD.md) 補或改測試後才寫實作。  
3. PR 需能對上 SDD 章節與測試名稱。
