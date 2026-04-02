using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using CompanyAPP.Dtos;
using CompanyAPP.Dtos.Common;
using CompanyAPP.Dtos.Reports;


namespace CompanyAPP.Services.Employees
{
    public class EmployeeExcelService : IEmployeeExcelService
    {
        private readonly CompanyAppContext _context;

        public EmployeeExcelService(CompanyAppContext context)
        {
            _context = context;
        }

        public async Task<byte[]> ExportToExcelAsync(List<int>? ids)
        {
            var query = _context.Employee.Include(e => e.Company).AsQueryable();

            if (ids != null && ids.Any())
                query = query.Where(e => ids.Contains(e.Id));

            var employees = await query.ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("員工列表");

            var headers = new[] { "員工編號", "姓名", "職位", "Email", "所屬公司" };

            for (int i = 0; i < headers.Length; i++)
                worksheet.Cell(1, i + 1).Value = headers[i];

            var headerRange = worksheet.Range("A1:E1");

            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

            int row = 2;

            foreach (var emp in employees)
            {
                worksheet.Cell(row, 1).Value = emp.StaffId;
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

        public async Task<ImportResult> ImportFromExcelAsync(Stream fileStream)
        {
            var result = new ImportResult();

            using var workbook = new XLWorkbook(fileStream);

            var worksheet = workbook.Worksheet(1);

            var range = worksheet.RangeUsed();

            if (range == null) return result;

            var rows = range.RowsUsed().Skip(1);

            foreach (var row in rows)
            {
                try
                {
                    var name = row.Cell(2).GetValue<string>();
                    var position = row.Cell(3).GetValue<string>();
                    var email = row.Cell(4).GetValue<string>();
                    var companyName = row.Cell(5).GetValue<string>();

                    if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email)) continue;

                    var isEmailExist = await _context.Employee.AnyAsync(e => e.Email == email);
                    if (isEmailExist)
                    {
                        // 直接丟出異常，會被你下面的 catch 抓到並記錄在 Reports 裡
                        throw new Exception($"Email {email} 已存在於系統中，不可重複匯入。");
                    }

                    var company = await _context.Company
                        .FirstOrDefaultAsync(c => c.Name == companyName);

                    if (company == null)
                        throw new Exception($"找不到公司 {companyName}");

                    _context.Add(new Employee
                    {
                        Name = name,
                        Position = position,
                        Email = email,
                        CompanyId = company.Id,
                        Status = Employee.EmployeeStatus.Unregistered
                    });

                    result.SuccessCount++;
                }
                catch (Exception ex)
                {
                    result.Reports.Add(new RowReport
                    {
                        RowNumber = row.RowNumber(),
                        Message = ex.Message
                    });
                }
            }

            if (result.SuccessCount > 0)
                await _context.SaveChangesAsync();

            return result;
        }
    }
}