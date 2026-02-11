// src/Controllers/Api/MissionsApiController.cs

using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyAPP.Controllers.Api
{
    [Route("api/missions")]
    [ApiController]
    [Authorize]
    public class MissionsApiController : ControllerBase
    {
        private readonly CompanyAppContext _context;
        public MissionsApiController(CompanyAppContext context) { _context = context; }

        [HttpGet]
        public async Task<IActionResult> GetMissions()
        {
            var missions = await _context.Mission
                .Include(m => m.Company).Include(m => m.Employee)
                .Select(m => new {
                    m.Id,
                    m.Title,
                    m.Deadline,
                    m.Status,
                    CompanyName = m.Company != null ? m.Company.Name : "未指定",
                    EmployeeName = m.Employee != null ? m.Employee.Name : "未指派"
                }).ToListAsync();
            return Ok(missions);
        }

        // --- 關鍵補齊：取得單一任務詳情 ---
        [HttpGet("{id}")]
        public async Task<IActionResult> GetMission(int id)
        {
            var m = await _context.Mission
                .Include(m => m.Company)
                .Include(m => m.Employee)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (m == null) return NotFound();

            return Ok(new
            {
                m.Id,
                m.Title,
                m.Description,
                m.CreateDate,
                m.Deadline,
                m.Status,
                CompanyName = m.Company?.Name ?? "未指定",
                EmployeeName = m.Employee?.Name ?? "未指派"
            });
        }
    }
}