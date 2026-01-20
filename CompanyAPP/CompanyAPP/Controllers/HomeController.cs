using CompanyAPP.Data;    
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace CompanyAPP.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {

        private readonly CompanyAppContext _context;

        public HomeController(CompanyAppContext context)
        {
            _context = context;
        }

        // 首頁：撈資料做圖表
        public async Task<IActionResult> Index()
        {
            // 1. 使用 LINQ 撈出每間廠商的員工數
            var data = await _context.Company
                .Include(c => c.Employees)
                .Select(c => new
                {
                    CompanyName = c.Name,
                    EmployeeCount = c.Employees != null ? c.Employees.Count : 0
                })
                .ToListAsync();

            // 2. 把資料拆成兩個陣列傳給前端 (Chart.js 需要這種格式)
            ViewBag.CompanyNames = data.Select(d => d.CompanyName).ToArray();
            ViewBag.EmployeeCounts = data.Select(d => d.EmployeeCount).ToArray();

            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

    }
}