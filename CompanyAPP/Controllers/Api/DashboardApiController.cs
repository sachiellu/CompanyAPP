using CompanyAPP.Data;
using CompanyAPP.Models; // 關鍵：一定要引用這個
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyAPP.Controllers.Api
{
    [Route("api/dashboard")]
    [ApiController]
    public class DashboardApiController : ControllerBase
    {
        private readonly CompanyAppContext _context;
        public DashboardApiController(CompanyAppContext context) { _context = context; }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var companyCount = await _context.Company.CountAsync();
            var employeeCount = await _context.Employee.CountAsync();

            // 修改點：直接用 MissionStatus，前提是上面有 using CompanyAPP.Models
            var missionCount = await _context.Mission.CountAsync(m => m.Status == MissionStatus.Pending);

            var chartData = await _context.Company
                .Select(c => new
                {
                    name = c.Name,
                    count = c.Employees != null ? c.Employees.Count() : 0
                }).ToListAsync();

            return Ok(new
            {
                totalCompanies = companyCount,
                totalEmployees = employeeCount,
                pendingMissions = missionCount,
                chartData = chartData
            });
        }
    }
}