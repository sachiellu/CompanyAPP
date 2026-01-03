
# 企業資源管理系統 (CompanyAPP)

本專案為基於 **.NET 9.0 (ASP.NET Core MVC)** 架構開發的企業資源管理平台 (ERP)。
系統整合廠商維護、人力資源管理、任務派工與圖表統計，更導入了 **OWASP ZAP 資安掃描**、**三層式權限控管 (RBAC)** 與 **正式/測試環境分離 (CI/CD 概念)** 的商業級開發規範。

<br>

## 技術架構(Tech Stack)

*   **Framework**: .NET 9.0 / ASP.NET Core MVC
*   **Database**: SQLite (EF Core Code First)
*   **Frontend**: Bootstrap 5, jQuery, Chart.js
*   **Auth**: ASP.NET Core Identity (Security Hardened)
*   **API Doc**: Swagger (OpenAPI)
*   **Security Tools**: OWASP ZAP (DAST), SonarLint
*   **Cloud & DevOps**: Fly.io (Docker Container), Multi-Environment Deployment


## 重點功能 (Features)

### 1. 企業級資安與架構 (Security & Architecture)
*   **資安防護 (Hardened Security)**：
    *   通過 **OWASP ZAP** 主動掃描，修復 High/Medium 風險漏洞。
    *   實作 **Secure Headers** (HSTS, X-Content-Type-Options, X-Frame-Options)。
    *   強制 **HTTPS** 與 **Secure Cookie** 政策。
    *   修復 **登出快取漏洞 (No-Cache)**，防止瀏覽器回上一頁查看敏感資料。
*   **三層式權限控管 (RBAC)**：
    *   **Admin (系統管理員)**：最高權限，管理帳號與權限指派。
    *   **Manager (經理)**：可管理員工資料、派工、廠商。
    *   **User (一般員工)**：僅限讀取與檢視指派任務。
*   **稽核日誌 (Audit Log)**：追蹤所有敏感操作（登入/登出/資料異動）。
*   **環境隔離**：實作 `QA` (測試) 與 `Production` (正式) 環境分離，配置檔與敏感資料 (Secrets) 完全脫離程式碼。

### 2. 核心業務模組
*   **廠商管理 (Vendors)**：支援雲端圖床 (Cloudinary) 上傳、預覽與維護。
*   **員工管理 (Employees)**：支援 AJAX 即時搜尋、分頁排序、批次刪除。
*   **任務派工 (Missions)**：具備時效警示、狀態追蹤。
*   **數據儀表板 (Dashboard)**：首頁整合 Chart.js 視覺化統計。

### 3. API 與擴充性 (API & Scalability)

*   **RESTful API 架構**：
    *   實作 **Hybrid (混合式) 架構**，在 MVC 基礎上擴充 Web API (`api/CompaniesApi`)。
    *   將核心商業邏輯 (`Service Layer`) 進行解耦，使 API 與 MVC Controller 共用同一套邏輯，確保資料一致性。

*   **API 文件化 (Swagger/OpenAPI)**：
    *   整合 **Swashbuckle**，自動生成 API 規格文件。
    *   提供可互動的 **Swagger UI**，方便前端/App 開發者進行接口測試與除錯。

---

## 版本更新紀錄 (Changelog)

### [v2.3] - 商業級資安加固與三層權限架構 (Release)

**本次更新將系統標準提升至商業交付等級，重點修復資安漏洞並完善權限模型。**

*   **資安與滲透測試 (Security & Penetration Testing)**
    *   **OWASP ZAP 驗證**：完成 QA 環境的主動掃描，確認 SQL Injection、XSS、CSRF 等高風險漏洞均已修復。
    *   **敏感資料保護**：移除 `appsettings.json` 中所有敏感金鑰，全面改用 **User Secrets (Local)** 與 **Platform Secrets (Cloud)** 管理。
    *   **登出機制重構**：強制清除瀏覽器快取 (Cache-Control: no-store)，並防止 CSRF 登出攻擊。
    *   **身分驗證強化**：關閉開發模式的「略過驗證連結」，強制執行 SMTP 寄信驗證流程；啟用「登入失敗鎖定 (Lockout)」機制防止暴力破解。

*   **權限與帳號管理 (RBAC Refinement)**
    *   **三層權限實作**：正式區分 **Admin / Manager / User** 三種角色，並實作對應的 Controller 與 View 權限過濾。
    *   **權限管理介面**：Admin 可在後台快速升級/降級用戶角色。
    *   **手動開通機制**：針對 Email 系統異常狀況，增加 Admin 後台「手動開通 (Manual Verify)」功能，保留管理彈性。


### [v2.2] - 維運穩定性、資安稽核與介面優化

*   **核心資安與稽核 (CRITICAL)**
    *   **新增稽核日誌 (Audit Log) 功能**：開始追蹤記錄所有敏感系統操作與用戶活動。
    *   **Data Protection Keys**：實作 Data Protection Keys 儲存到 Fly Volume，解決多實例 Session 丟失問題。
    *   **Admin 帳號恢復**：優化 Seed Data 邏輯，確保核心 Admin 帳號可自動重建並賦予權限。

*   **介面與使用者體驗 (UI/RWD)**
    *   **列表表格 (RWD):** 對廠商、員工列表實作 `table-responsive`、`d-none` 隱藏次要欄位等響應式優化。
    *   **2FA 介面中文化:** 完成**雙重認證 (2FA)** 相關頁面的中文化工作。(尚未實裝功能)。

### [v2.1] - 緊急安全補丁與 RABC 強化

*   **安全修正 (CRITICAL)**：修復 `EmployeesController` 後端授權邏輯，防止所有已登入用戶惡意修改或刪除員工資料。
*   **功能調整**：統一導航列與 Controller 權限，開放一般用戶可以查看廠商、員工與任務的**列表**及**詳情**。

### [v2.0]

本次更新著重於安全性補強與使用者體驗優化。

*   **新增功能**
    *   **Email 驗證機制**：實作後端發信服務，取代原本無驗證的註冊流程。
    *   **測試用特赦工具**：新增批次驗證功能，方便開發階段管理測試帳號。
*   **介面修正**
    *   **補充中文翻譯**：修正 V1 版本中缺漏的表單驗證提示與系統錯誤訊息中文化。

### [v1.0] - 初始版本

*   專案初始化，建立 MVC 架構。
*   完成廠商、員工、任務三大模組 CRUD 功能。
*   整合 Chart.js 儀表板。

---

##  快速開始 (Quick Start)

### 1. 本地開發 (Local)
1.  複製專案：
    ```bash
    git clone https://github.com/sachiellu/CompanyAPP.git
    ```
2.  設定 User Secrets (請勿將密碼寫入 appsettings.json)：
    ```bash
    dotnet user-secrets set "EmailSettings:AppPassword" "你的密碼"
    dotnet user-secrets set "Cloudinary:ApiSecret" "你的密碼"
    ```
3.  更新資料庫：
    ```bash
    dotnet ef database update
    ```
4.  啟動：
    ```bash
    dotnet run
    ```

### 2. 雲端部署 (Fly.io Production)

本專案採用環境變數注入設定，部署前請確保 Secrets 已設定：

```bash
# 設定正式環境變數 (App 名稱: companyapp-luyu)
fly secrets set EmailSettings__AppPassword="..." Cloudinary__ApiSecret="..." -a companyapp-luyu

# 部署到正式環境
fly deploy -a companyapp-luyu
```

## 系統初始化設定 (Seed Data)

系統首次啟動時，將透過 Seed Data 自動建立預設管理員帳號：

*   **預設帳號**: admin@default.com

*   **預設密碼**: Admin123!


> **注意**：正式環境中，所有新註冊用戶預設為 **User**權限，必須由上述 Admin 登入後手動升級權限。




