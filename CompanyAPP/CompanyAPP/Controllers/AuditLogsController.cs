using CompanyAPP.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyAPP.Controllers
{
    [Authorize(Roles = "Admin")]
    public class AuditLogsController : Controller
    {
        private readonly CompanyAppContext _context;

        public AuditLogsController(CompanyAppContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            // 撈取最新的 50 筆紀錄，按照時間倒序排列
            var logs = await _context.AuditLogs
                                     .OrderByDescending(x => x.Timestamp)
                                     .Take(50)
                                     .ToListAsync();
            return View(logs);
        }
    }
}