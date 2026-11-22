# Test-Driven Development (TDD)

文件狀態：與 [SDD.md](./SDD.md) 一併使用。  
適用：後端服務／API 變更、回歸修復、協作時的測試節奏。

## 1. 目的

先用失敗的測試鎖住行為，再寫剛好讓測試通過的程式。禁止先改產品碼再補測試當交代。

## 2. 測試落點

| 層級 | 位置 | 何時必寫 |
|------|------|----------|
| 後端單元 | `CompanyAPP.Tests` | Service、API 行為、稽核寫入 |
| 前端靜態檢查 | `company-frontend`：`npm run lint` | UI／型別變更 |

目前以 .NET 測試為主契約；前端以 TypeScript 與 lint 守門。新的畫面行為若可抽純函式，應補測試而非只靠手動點擊。

## 3. 節奏（Red → Green → Refactor）

1. **Red：** 依 SDD 寫一個會失敗的測試（名稱寫出業務，例如建立員工後應有一筆 Audit Create）。  
2. **Green：** 最小實作讓測試通過。  
3. **Refactor：** 不改測試語意，只整理重複與命名。  
4. 本地 `dotnet test CompanyAPP.sln` 全綠再 commit。

CI（`.github/workflows/dotnet.yml`）在 `main`／PR 執行 restore、build、test；測試失敗不得部署。

## 4. 與 SDD 的協作

| 情況 | 先做 | 再做 |
|------|------|------|
| 新模組或改資料流 | 更新 SDD 對應章節 | 依新契約寫失敗測試 |
| 已知規格的 bug | 寫重現失敗的測試 | 修程式至 Green |
| 只改文案／版面且無行為 | 不強制新測試 | lint；若有抽離的格式函式則補測 |

SDD 是「系統應該長怎樣」；TDD 是「怎樣證明它還是那樣」。兩者衝突時：先修正測試與 SDD 其中一方使之一致，禁止只改產品碼讓行為 silently 漂移。

## 5. 命名與隔離

- 測試方法：行為 + 期望（`AddAsync_ShouldWriteAuditCreate`）。  
- 資料庫用 InMemory 或測試專用 context，不碰正式 `company.db`。  
- 外部依賴（寄信、圖檔、Fly）用 mock；測試不可呼叫真實 Brevo。

## 6. 完成定義（DoD）

- 相關測試新增或更新，且 `dotnet test` 通過。  
- 未引入對正式環境的金鑰或真實外部服務。  
- PR 說明寫清：對應 SDD 章節、Red 測試名稱、行為差異。
