using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace CompanyAPP.Controllers
{
    [Authorize]
    public class EmployeesController : Controller
    {
        private readonly CompanyAppContext _context;


        public EmployeesController(CompanyAppContext context)
        {
            _context = context;
        }

        // GET: Companies
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
                case "name_desc":
                    employees = employees.OrderByDescending(s => s.Name);
                    break;
                case "Position":
                    employees = employees.OrderBy(s => s.Position);
                    break;
                case "pos_desc":
                    employees = employees.OrderByDescending(s => s.Position);
                    break;
                case "Email":
                    employees = employees.OrderBy(s => s.Email);
                    break;
                case "email_desc":
                    employees = employees.OrderByDescending(s => s.Email);
                    break;
                case "Company":
                    employees = employees.OrderBy(s => s.Company.Name);
                    break;
                case "comp_desc":
                    employees = employees.OrderByDescending(s => s.Company.Name);
                    break;
                default: // 預設依 ID 或 姓名 排序
                    employees = employees.OrderBy(s => s.Name);
                    break;
            }

            return View(await employees.ToListAsync());
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
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
            }

            return RedirectToAction(nameof(Index));
        }

        // GET: Employees/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null) return NotFound();

            var employee = await _context.Employee
                .Include(e => e.Company)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (employee == null) return NotFound();

            return View(employee);
        }

        // GET: Employees/Create
        public IActionResult Create()
        {
            ViewData["CompanyId"] = new SelectList(_context.Company, "Id", "Name");
            return View();
        }

        // POST: Employees/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Employee employee)
        {

            // if (ModelState.IsValid) 
            {
                _context.Add(employee);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }

            ViewData["CompanyId"] = new SelectList(_context.Company, "Id", "Name", employee.CompanyId);
            return View(employee);
        }

        // GET: Employees/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var employee = await _context.Employee.FindAsync(id);
            if (employee == null) return NotFound();

            ViewData["CompanyId"] = new SelectList(_context.Company, "Id", "Name", employee.CompanyId);
            return View(employee);
        }

        // POST: Employees/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, Employee employee)
        {
            if (id != employee.Id) return NotFound();

            // if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(employee);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!EmployeeExists(employee.Id)) return NotFound();
                    else throw;
                }
                return RedirectToAction(nameof(Index));
            }
            ViewData["CompanyId"] = new SelectList(_context.Company, "Id", "Name", employee.CompanyId);
            return View(employee);
        }

        // GET: Employees/Delete/5
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

        // POST: Employees/Delete/5
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
            return RedirectToAction(nameof(Index));
        }

        private bool EmployeeExists(int id)
        {
            return _context.Employee.Any(e => e.Id == id);
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
    }
}

