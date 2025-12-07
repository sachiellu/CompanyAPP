# 企業資源管理系統 (CompanyAPP)

本專案為基於 ASP.NET Core 9.0 架構開發的企業資源管理平台 (ERP)，整合廠商維護、人力資源管理、任務派工與圖表統計，並實作完整的身分驗證 (RBAC) 與 Email 驗證機制。


## 技術架構(Tech Stack)

*   **Framework**: .NET 9.0 / ASP.NET Core MVC

*   **Database**: SQLite (EF Core Code First)

*   **Frontend**: Bootstrap 5, jQuery, Chart.js

*   **Auth**: ASP.NET Core Identity (Support Email Verification)


## 重點功能 (Features)

### 1. 核心系統

*   **權限控管 (RBAC)**：區分管理員 (Admin) 與一般用戶 (User)，並具備防刪除保護機制。

*   **帳號驗證**：實作 SMTP 發信服務，註冊後需透過 Email 連結開通帳號。

*   **安全機制**：針對系統預設的最高管理者 (Super Admin) 實作防刪除與降級保護機制。

*   **[New] 稽核日誌 (Audit Log)**：追蹤和記錄所有敏感操作，如用戶登入/登出、資料新增/刪除/修改等，供管理員查詢。

*   **[Update] 中文化**：核心業務模組（員工、廠商、派工）與常用帳戶功能（登入、註冊）已完成繁體中文化。

### 2. 業務模組

*   **廠商管理 (Vendors)**：支援圖文維護、即時預覽，並可直接檢視旗下員工。

*   **員工管理 (Employees)**：支援 AJAX 即時搜尋、批次刪除與外鍵關聯。

*   **任務派工 (Missions)**：具備時效警示、狀態追蹤與智慧表單功能。

*   **數據儀表板 (Dashboard)**：首頁整合 Chart.js 統計圖表。

---

###  開發輔助工具 (Dev Tools)

> **注意：本區塊功能僅供測試使用，正式上線前將移除。**

*   **帳號一鍵驗證 (Batch Verification)**
    *   **用途**：解決測試環境中存在大量假信箱、無法實際收信驗證的問題。
    *   **功能**：可一鍵將資料庫中所有「未驗證」帳號強制轉為「已驗證」，加速功能測試。

---

## 版本更新紀錄 (Changelog)

### [v2.2] - 維運穩定性、資安稽核與介面優化 (最新)

*   **核心資安與稽核 (CRITICAL)**
    *   **新增稽核日誌 (Audit Log) 功能**：開始追蹤記錄所有敏感系統操作與用戶活動。
    *   **Data Protection Keys**：實作 Data Protection Keys 儲存到 Fly Volume，解決多實例 Session 丟失問題。
    *   **Admin 帳號恢復**：優化 Seed Data 邏輯，確保核心 Admin 帳號可自動重建並賦予權限。

*   **介面與使用者體驗 (UI/RWD)**
    *   **列表表格 (RWD):** 對廠商、員工列表實作 `table-responsive`、`d-none` 隱藏次要欄位等響應式優化。
    *   **2FA 介面中文化:** 完成**雙重認證 (2FA)** 相關頁面的中文化工作。

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

##  快速開始

**1. 環境準備**(確保已安裝 .NET 9.0 SDK)
```bash
git clone [Repository URL]
```


**2. 資料庫設定**(於專案根目錄執行)
```bash
dotnet ef database update
```


**3. 啟動專案**
```bash
dotnet run
```


## 系統初始化設定

系統首次啟動時，將透過 Seed Data 自動建立預設管理員帳號：

*   **預設帳號**: admin@default.com

*   **預設密碼**: Admin123!


> **注意**：線上環境 (Production) 請透過環境變數 (Environment Variables) 覆寫上述預設帳密，以確保資安




