using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;

namespace CompanyAPP.Controllers
{
    [Authorize(Roles = "Admin,Manager")]
    public class EmployeesController : Controller
    {
        private readonly CompanyAppContext _context;

        public EmployeesController(CompanyAppContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> Index(string searchString, string sortOrder)
        {
            // 設定排序參數 (ViewData 用來切換 升冪/降冪)
            ViewData["NameSortParm"] = String.IsNullOrEmpty(sortOrder) ? "name_desc" : "";
            ViewData["PosSortParm"] = sortOrder == "Position" ? "pos_desc" : "Position";
            ViewData["EmailSortParm"] = sortOrder == "Email" ? "email_desc" : "Email";
            ViewData["CompSortParm"] = sortOrder == "Company" ? "comp_desc" : "Company";
            ViewData["CurrentFilter"] = searchString;

            var employees = _context.Employee.Include(e => e.Company).AsQueryable();

            if (!string.IsNullOrEmpty(searchString))
            {
                employees = employees.Where(s => s.Name.Contains(searchString));
                                          //|| s.Position.Contains(searchString)
                                          //|| s.Email.Contains(searchString)
                                          //|| s.Company.Name.Contains(searchString));
            }

            switch (sortOrder)
            {
                case "name_desc": employees = employees.OrderByDescending(s => s.Name); break;
                case "Position": employees = employees.OrderBy(s => s.Position); break;
                case "pos_desc": employees = employees.OrderByDescending(s => s.Position); break;
                case "Email": employees = employees.OrderBy(s => s.Email); break;
                case "email_desc": employees = employees.OrderByDescending(s => s.Email); break;
                case "Company": employees = employees.OrderBy(s => s.Company.Name); break;
                case "comp_desc": employees = employees.OrderByDescending(s => s.Company.Name); break;
                // 預設依 ID 或 姓名 排序
                default: employees = employees.OrderBy(s => s.Name); break;
            }

            return View(await employees.ToListAsync());
        }

        // 專門給 AJAX 呼叫的搜尋功能
        public async Task<IActionResult> Filter(string searchString)
        {
            var employees = _context.Employee.Include(e => e.Company).AsQueryable();

            if (!string.IsNullOrEmpty(searchString))
            {
                // 搜尋邏輯：包含 姓名、職位 或 Email
                employees = employees.Where(s => s.Name.Contains(searchString)
                                              || s.Position.Contains(searchString)
                                              || s.Email.Contains(searchString));
            }

            // 注意：這裡回傳的是 PartialView (只有表格的那一小塊 HTML)
            return PartialView("_EmployeeTable", await employees.ToListAsync());
        }

        [HttpGet]
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null) return NotFound();

            var employee = await _context.Employee
                .Include(e => e.Company)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (employee == null) return NotFound();
            return View(employee);
        }

        // [GET] 匯出 Excel
        public async Task<IActionResult> ExportToExcel()
        {
            var employees = await _context.Employee.Include(e => e.Company).ToListAsync();

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("員工列表");

                // 標題列
                worksheet.Cell(1, 1).Value = "姓名";
                worksheet.Cell(1, 2).Value = "職位";
                worksheet.Cell(1, 3).Value = "Email";
                worksheet.Cell(1, 4).Value = "所屬公司";

                var header = worksheet.Range("A1:D1");
                header.Style.Font.Bold = true;
                header.Style.Fill.BackgroundColor = XLColor.LightGray;

                // 內容
                int row = 2;
                foreach (var emp in employees)
                {
                    worksheet.Cell(row, 1).Value = emp.Name;
                    worksheet.Cell(row, 2).Value = emp.Position;
                    worksheet.Cell(row, 3).Value = emp.Email;
                    worksheet.Cell(row, 4).Value = emp.Company?.Name ?? "未分配";
                    row++;
                }

                worksheet.Columns().AdjustToContents();

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Employees_{DateTime.Now:yyyyMMdd}.xlsx");
                }
            }
        }

        // [GET] 顯示匯入頁面
        [HttpGet]
        public IActionResult Import()
        {
            return View();
        }

        // [POST] 執行匯入
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Import(IFormFile excelFile)
        {
            if (excelFile == null || excelFile.Length == 0)
            {
                ModelState.AddModelError("", "請選擇一個檔案。");
                return View();
            }

            int successCount = 0;
            int errorCount = 0;
            var errorMessages = new List<string>();

            using (var stream = new MemoryStream())
            {
                await excelFile.CopyToAsync(stream);
                stream.Position = 0;

                using (var workbook = new XLWorkbook(stream))
                {

                    var worksheet = workbook.Worksheet(1);
                    var rows = worksheet.RangeUsed().RowsUsed().Skip(1); //跳過標題

                    foreach (var row in rows)
                    {
                        try
                        {
                            var name = row.Cell(1).GetValue<string>();
                            var position = row.Cell(2).GetValue<string>();
                            var email = row.Cell(3).GetValue<string>();
                            var companyName = row.Cell(4).GetValue<string>();

                            if (string.IsNullOrWhiteSpace(name)) continue;

                            // 找公司ID
                            var company = await _context.Company.FirstOrDefaultAsync(c => c.Name == companyName);

                            if (company == null)
                            {
                                throw new Exception($"找不到名為 '{companyName}' 的公司，請確認名稱是否正確。");
                            }

                            var employee = new Employee
                            {
                                Name = name,
                                Position = position,
                                Email = email,
                                CompanyId = company.Id
                            };

                            _context.Add(employee);
                            successCount++;
                        }
                        catch (Exception ex)
                        {
                            errorCount++;
                            errorMessages.Add($"第 {row.RowNumber()} 列匯入失敗: {ex.Message}");
                        }
                    }

                    if (successCount > 0)
                    {
                        await _context.SaveChangesAsync();
                        string msg = $"匯入成功！新增 {successCount} 筆。";
                        if (errorCount > 0) msg += $" (失敗 {errorCount} 筆，請檢查 Excel 內容)";
                        TempData["SuccessMessage"] = msg;
                    }
                    else
                    {
                        ModelState.AddModelError("", "沒有資料被匯入。");
                        if (errorMessages.Any())
                        {
                            ModelState.AddModelError("", $"錯誤原因: {errorMessages.First()}");
                        }
                        return View();
                    }
                }
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpGet]
        public IActionResult Create()
        {
            ViewData["CompanyId"] = new SelectList(_context.Company, "Id", "Name");
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Employee employee)
        {
            if (ModelState.IsValid) 
            {
                _context.Add(employee);
                await _context.SaveChangesAsync();
                TempData["SuccessMessage"] = "員工已新增成功！";
                return RedirectToAction(nameof(Index));
            }

            ViewData["CompanyId"] = new SelectList(_context.Company, "Id", "Name", employee.CompanyId);
            return View(employee);
        }

        [HttpGet]
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var employee = await _context.Employee.FindAsync(id);
            if (employee == null) return NotFound();

            ViewData["CompanyId"] = new SelectList(_context.Company, "Id", "Name", employee.CompanyId);
            return View(employee);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, Employee employee)
        {
            if (id != employee.Id) return NotFound();

            if (ModelState.IsValid)
            {
                //  從資料庫撈出「受追蹤(Tracked)」的實體
                var dbEmployee = await _context.Employee.FindAsync(id);
                if (dbEmployee == null) return NotFound();

                //  只更新「允許」被修改的欄位
                dbEmployee.Name = employee.Name;
                dbEmployee.Position = employee.Position;
                dbEmployee.CompanyId = employee.CompanyId;

                // 如果是 Admin，才允許改 Email
                if (User.IsInRole("Admin"))
                {
                    dbEmployee.Email = employee.Email;
                }

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!EmployeeExists(employee.Id)) return NotFound();
                    else throw;
                }
                TempData["SuccessMessage"] = "員工已更新成功！";
                return RedirectToAction(nameof(Index));
            }
            ViewData["CompanyId"] = new SelectList(_context.Company, "Id", "Name", employee.CompanyId);
            return View(employee);
        }

        // 刪除 (保留舊的 GET 方法做 fallback)
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null) return NotFound();

            var employee = await _context.Employee
                .Include(e => e.Company)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (employee == null) return NotFound();

            return View(employee);
        }

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var employee = await _context.Employee.FindAsync(id);
            if (employee != null)
            {
                _context.Employee.Remove(employee);
            }
            await _context.SaveChangesAsync();
            TempData["SuccessMessage"] = "員工已成功刪除！";
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteBatch(List<int> ids)
        {
            if (ids == null || ids.Count == 0)
            {
                return RedirectToAction(nameof(Index));
            }

            var employeesToDelete = await _context.Employee
                .Where(e => ids.Contains(e.Id))
                .ToListAsync();

            if (employeesToDelete.Any())
            {
                _context.Employee.RemoveRange(employeesToDelete);
                await _context.SaveChangesAsync();
                TempData["SuccessMessage"] = $"成功刪除 {employeesToDelete.Count} 筆員工資料！";
            }

            return RedirectToAction(nameof(Index));
        }

        // 輔助方法
        private bool EmployeeExists(int id)
        {
            return _context.Employee.Any(e => e.Id == id);
        }
    }
}

