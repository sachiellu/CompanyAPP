using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;

namespace CompanyAPP.Services
{
    public class RowReport
    {
        public int RowNumber { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Status { get; set; }
        public string? Message { get; set; }
    }

    public class ImportResult
    {
        public int SuccessCount { get; set; }
        public List<RowReport> Reports { get; set; } = new List<RowReport>();
    }

    public class EmployeeService : IEmployeeService
    {
        private readonly CompanyAppContext _context;

        public EmployeeService(CompanyAppContext context)
        {
            _context = context;
        }

        // 1. 取得所有員工 (優化：加入 StaffId 搜尋)
        public async Task<IEnumerable<Employee>> GetAllAsync(string? searchString)
        {
            var query = _context.Employee.Include(e => e.Company).AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchString))
            {
                searchString = searchString.Trim();
                query = query.Where(e =>
                    e.Name.Contains(searchString) ||
                    e.StaffId.Contains(searchString) ||
                    e.Position.Contains(searchString) ||
                    e.Email.Contains(searchString) ||
                    (e.Company != null && e.Company.Name.Contains(searchString))
                );
            }

            return await query.OrderBy(e => e.StaffId).ToListAsync();
        }

        public async Task<Employee?> GetByIdAsync(int id) =>
            await _context.Employee.Include(e => e.Company).FirstOrDefaultAsync(e => e.Id == id);

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

        public async Task<int> DeleteBatchAsync(List<int> ids)
        {
            var items = await _context.Employee.Where(e => ids.Contains(e.Id)).ToListAsync();
            if (!items.Any()) return 0;
            _context.Employee.RemoveRange(items);
            return await _context.SaveChangesAsync();
        }

        public async Task<byte[]> ExportToExcelAsync(List<int>? ids = null)
        {
            var query = _context.Employee.Include(e => e.Company).AsQueryable();
            if (ids != null && ids.Any()) query = query.Where(e => ids.Contains(e.Id));
            var employees = await query.ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("員工列表");

            // 標題定義
            var headers = new[] { "員工編號", "姓名", "職位", "Email", "所屬公司" };
            for (int i = 0; i < headers.Length; i++) worksheet.Cell(1, i + 1).Value = headers[i];

            var headerRange = worksheet.Range("A1:E1");
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

            int row = 2;
            foreach (var emp in employees)
            {
                worksheet.Cell(row, 1).SetValue(emp.StaffId).Style.NumberFormat.Format = "@";
                worksheet.Cell(row, 2).Value = emp.Name;
                worksheet.Cell(row, 3).Value = emp.Position;
                worksheet.Cell(row, 4).Value = emp.Email;
                worksheet.Cell(row, 5).Value = emp.Company?.Name ?? "未分配";
                row++;
            }
            worksheet.Columns().AdjustToContents();
            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        // 8. 智慧偵測匯入 (深度優化版)
        public async Task<ImportResult> ImportFromExcelAsync(Stream fileStream)
        {
            var result = new ImportResult();
            using var workbook = new XLWorkbook(fileStream);
            var worksheet = workbook.Worksheet(1);
            var range = worksheet.RangeUsed();
            if (range == null) return result;

            var firstRow = worksheet.Row(1);
            int staffIdIdx = 0, nameIdx = 0, posIdx = 0, emailIdx = 0, compIdx = 0;

            // 智慧找標題 (不分順序)
            for (int i = 1; i <= firstRow.LastCellUsed().Address.ColumnNumber; i++)
            {
                var header = firstRow.Cell(i).GetValue<string>().Trim().ToLower();
                if (header.Contains("編號") || header.Contains("工號")) staffIdIdx = i;
                else if (header.Contains("姓名")) nameIdx = i;
                else if (header.Contains("職位")) posIdx = i;
                else if (header.Contains("email")) emailIdx = i;
                else if (header.Contains("公司") || header.Contains("廠商")) compIdx = i;
            }

            if (nameIdx == 0 || emailIdx == 0)
            {
                result.Reports.Add(new RowReport { Message = "Excel 格式錯誤：標題列必須包含 '姓名' 與 'Email'。" });
                return result;
            }

            // 效能預加載
            var companies = await _context.Company.ToListAsync();
            var companyMap = companies.ToDictionary(c => c.Name.Trim().ToLower(), c => c.Id);

            // 已存在的 Email 集合 (包含 DB 與 本次 Excel 已處理的)
            var existingEmailSet = new HashSet<string>(
                await _context.Employee.Select(e => e.Email.ToLower()).ToListAsync(),
                StringComparer.OrdinalIgnoreCase
            );

            foreach (var row in range.RowsUsed().Skip(1))
            {
                var report = new RowReport { RowNumber = row.RowNumber() };
                try
                {
                    report.Name = row.Cell(nameIdx).GetValue<string>().Trim();
                    report.Email = row.Cell(emailIdx).GetValue<string>().Trim();

                    // 1. 基本檢查
                    if (string.IsNullOrWhiteSpace(report.Name) || string.IsNullOrWhiteSpace(report.Email)) continue;

                    // 2. Email 重複檢查 (含 DB 比對與 Excel 自體比對)
                    if (existingEmailSet.Contains(report.Email))
                    {
                        report.Status = "Duplicate";
                        report.Message = $"Email '{report.Email}' 已存在或重複";
                        result.Reports.Add(report);
                        continue;
                    }

                    // 3. 公司匹配檢查
                    var companyName = compIdx > 0 ? row.Cell(compIdx).GetValue<string>().Trim() : "";
                    if (!string.IsNullOrEmpty(companyName) && !companyMap.ContainsKey(companyName.ToLower()))
                    {
                        report.Status = "Error";
                        report.Message = $"系統找不到廠商: '{companyName}'";
                        result.Reports.Add(report);
                        continue;
                    }

                    // 4. 準備建立物件
                    int companyId = !string.IsNullOrEmpty(companyName) ? companyMap[companyName.ToLower()] : 1;

                    _context.Add(new Employee
                    {
                        StaffId = staffIdIdx > 0 ? row.Cell(staffIdIdx).GetValue<string>().Trim() : "",
                        Name = report.Name,
                        Position = posIdx > 0 ? row.Cell(posIdx).GetValue<string>().Trim() : "",
                        Email = report.Email,
                        CompanyId = companyId,
                        Status = Employee.EmployeeStatus.Unregistered
                    });

                    result.SuccessCount++;
                    existingEmailSet.Add(report.Email); // 標記為已處理
                }
                catch (Exception ex)
                {
                    report.Status = "Error";
                    report.Message = $"異常: {ex.Message}";
                    result.Reports.Add(report);
                }
            }

            if (result.SuccessCount > 0) await _context.SaveChangesAsync();
            return result;
        }
    }
}