using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;

namespace CompanyAPP.Services
{
    public class ImportResult
    {
        public int SuccessCount { get; set; }
        public List<string> ErrorMessages { get; set; } = new List<string>();
    }

    public class EmployeeService : IEmployeeService
    {
        private readonly CompanyAppContext _context;

        public EmployeeService(CompanyAppContext context)
        {
            _context = context;
        }

        // 1. 查詢與搜尋 (含排序)
        public async Task<IEnumerable<Employee>> GetAllAsync(string? searchString)
        {
            var query = _context.Employee.Include(e => e.Company).AsQueryable();

            if (!string.IsNullOrEmpty(searchString))
            {
                query = query.Where(e =>
                    e.Name.Contains(searchString) ||
                    e.Position.Contains(searchString) ||
                    e.Email.Contains(searchString) ||
                    e.Company.Name.Contains(searchString)
                );
            }

            // 預設排序 (你可以之後再加強排序參數)
            return await query.OrderBy(e => e.Name).ToListAsync();
        }

        public async Task<Employee?> GetByIdAsync(int id)
        {
            return await _context.Employee
                .Include(e => e.Company)
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task AddAsync(Employee employee)
        {
            _context.Add(employee);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Employee employee)
        {
            _context.Update(employee);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var emp = await _context.Employee.FindAsync(id);
            if (emp != null)
            {
                _context.Employee.Remove(emp);
                await _context.SaveChangesAsync();
            }
        }

        //  2. 批次刪除邏輯 (從 Controller 搬過來的)
        public async Task<int> DeleteBatchAsync(List<int> ids)
        {
            var employeesToDelete = await _context.Employee
                .Where(e => ids.Contains(e.Id))
                .ToListAsync();

            if (employeesToDelete.Any())
            {
                _context.Employee.RemoveRange(employeesToDelete);
                return await _context.SaveChangesAsync(); // 回傳刪除筆數
            }
            return 0;
        }

        //  3. 匯出 Excel 邏輯 (把產生檔案的邏輯搬過來)
        public async Task<byte[]> ExportToExcelAsync(List<int>? ids = null)
        {
            var query = _context.Employee.Include(e => e.Company).AsQueryable();

            if (ids != null && ids.Any())
            {
                query = query.Where(e => ids.Contains(e.Id));
            }
            var employees = await query.ToListAsync();

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("員工列表");

                // 標題
                worksheet.Cell(1, 1).Value = "姓名";
                worksheet.Cell(1, 2).Value = "職位";
                worksheet.Cell(1, 3).Value = "Email";
                worksheet.Cell(1, 4).Value = "所屬公司";

                // 設定標題樣式
                var header = worksheet.Range("A1:D1");
                header.Style.Font.Bold = true;
                header.Style.Fill.BackgroundColor = XLColor.LightGray;

                // 內容
                int row = 2;
                foreach (var emp in employees)
                {
                    worksheet.Cell(row, 1).Value = emp.Name;

                    // 強制設定為文字格式 (避免 0250 變成 250)
                    worksheet.Cell(row, 2).SetValue(emp.Position);
                    worksheet.Cell(row, 2).Style.NumberFormat.Format = "@";

                    worksheet.Cell(row, 3).Value = emp.Email;
                    worksheet.Cell(row, 4).Value = emp.Company?.Name ?? "未分配";
                    row++;
                }
                worksheet.Columns().AdjustToContents();

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    return stream.ToArray();
                }
            }
        }

        //  4. 優化後的匯入：增加防呆機制 (Trim)
        public async Task<ImportResult> ImportFromExcelAsync(Stream fileStream)
        {
            var result = new ImportResult();

            using (var workbook = new XLWorkbook(fileStream))
            {
                var worksheet = workbook.Worksheet(1);

                // 1. 抓取有資料的範圍 (防呆：如果全空則直接回傳)
                var range = worksheet.RangeUsed();
                if (range == null) return result;

                // 跳過第一列標題
                var rows = range.RowsUsed().Skip(1);

                // 預先抓取所有公司 (名稱 -> ID)，忽略大小寫與空白
                var companies = await _context.Company.ToListAsync();
                var companyMap = companies
                    .GroupBy(c => c.Name.Trim().ToLower()) // 先分組，解決重複名稱問題
                    .ToDictionary(
                        g => g.Key,          // Key: 公司名稱 (小寫)
                        g => g.First().Id    // Value: ID
                    );

                var excelEmails = new List<string>();
                foreach (var row in rows)
                {
                    var email = row.Cell(3).GetValue<string>().Trim();
                    if (!string.IsNullOrEmpty(email)) excelEmails.Add(email);
                }

                // 一次去資料庫查：這些 Email 哪些已經存在了？ (SQL: WHERE Email IN (...))
                // 使用 HashSet 讓比對速度變為 O(1) 極快
                var existingEmails = await _context.Employee
                    .Where(e => excelEmails.Contains(e.Email))
                    .Select(e => e.Email)
                    .ToListAsync();

                var existingEmailSet = new HashSet<string>(existingEmails, StringComparer.OrdinalIgnoreCase);

                // ---------------------------------------------------------

                foreach (var row in rows)
                {
                    try
                    {
                        var name = row.Cell(1).GetValue<string>().Trim();
                        var position = row.Cell(2).GetValue<string>().Trim();
                        var email = row.Cell(3).GetValue<string>().Trim();
                        var companyName = row.Cell(4).GetValue<string>().Trim();

                        // 1. 空行檢查
                        if (string.IsNullOrWhiteSpace(name) && string.IsNullOrWhiteSpace(email) && string.IsNullOrWhiteSpace(companyName))
                            continue;

                        // 2. 必填檢查
                        if (string.IsNullOrWhiteSpace(name))
                        {
                            result.ErrorMessages.Add($"第 {row.RowNumber()} 列失敗：姓名是必填的");
                            continue;
                        }
                        if (string.IsNullOrWhiteSpace(companyName))
                        {
                            result.ErrorMessages.Add($"第 {row.RowNumber()} 列失敗：所屬公司是必填的");
                            continue;
                        }

                        // 🔥 3. 重複檢查 (Email)
                        if (!string.IsNullOrWhiteSpace(email) && existingEmailSet.Contains(email))
                        {
                            // 這裡顯示「已存在」，並且跳過不新增
                            result.ErrorMessages.Add($"第 {row.RowNumber()} 列失敗：Email '{email}' 已存在");
                            continue;
                        }

                        // 4. 公司檢查
                        if (!companyMap.TryGetValue(companyName.ToLower(), out int companyId))
                        {
                            result.ErrorMessages.Add($"第 {row.RowNumber()} 列失敗：找不到公司 '{companyName}'");
                            continue;
                        }

                        var employee = new Employee
                        {
                            Name = name,
                            Position = position,
                            Email = email,
                            CompanyId = companyId
                        };

                        _context.Add(employee);
                        result.SuccessCount++;
                    }
                    catch (Exception ex)
                    {
                        result.ErrorMessages.Add($"第 {row.RowNumber()} 列發生錯誤: {ex.Message}");
                    }
                }

                if (result.SuccessCount > 0)
                {
                    try
                    {
                        await _context.SaveChangesAsync();
                    }
                    catch (Exception ex)
                    {
                        result.SuccessCount = 0;
                        result.ErrorMessages.Add($"資料庫存檔失敗: {ex.InnerException?.Message ?? ex.Message}");
                    }
                }
            }

            return result;
        }
    }
}