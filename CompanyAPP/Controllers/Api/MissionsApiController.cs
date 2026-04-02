// src/Controllers/Api/MissionsApiController.cs

using CompanyAPP.Data;
using CompanyAPP.Dtos.Missions;
using CompanyAPP.Models;
using CompanyAPP.Services.Common;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyAPP.Controllers.Api
    {
        [Route("api/missions")]
        [ApiController]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public class MissionsApiController : ControllerBase
        {
            private readonly CompanyAppContext _context;
            public MissionsApiController(CompanyAppContext context) { _context = context; }

            [HttpGet]
            public async Task<IActionResult> GetMissions()
            {
                var missions = await _context.Mission
                    .Include(m => m.Company).Include(m => m.Employee)
                    .Select(m => new
                    {
                        m.Id,
                        m.Title,
                        m.Deadline,
                        m.Status,
                        CompanyName = m.Company != null ? m.Company.Name : "未指定",
                        EmployeeName = m.Employee != null ? m.Employee.Name : "未指派"
                    }).ToListAsync();
                return Ok(missions);
            }

            // --- 取得單一任務詳情 ---
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

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateMission([FromBody] MissionUpdateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var mission = new Mission
            {
                Title = dto.Title,
                Description = dto.Description,

                Deadline = dto.Deadline ?? DateTime.Now.AddDays(7),

                CompanyId = dto.CompanyId ?? 0,
                EmployeeId = dto.EmployeeId ?? 0,

                Status = Enum.TryParse<MissionStatus>(dto.Status, out var tempStatus)
                         ? tempStatus
                         : MissionStatus.Pending,

                CreateDate = DateTime.Now
            };

            _context.Mission.Add(mission);
            await _context.SaveChangesAsync();

            await _auditService.LogAsync("Mission", "Create", $"Id: {mission.Id}", $"派發了新任務: {mission.Title}");

            return Ok(new { message = "任務指派成功！" });
        }


        // 補上修改任務
        [HttpPut("{id}")]
            [Authorize(Roles = "Admin,Manager")]
            public async Task<IActionResult> UpdateMission(int id, [FromBody] Mission mission)
            {
                if (id != mission.Id) return BadRequest("ID 不符");

                _context.Entry(mission).State = EntityState.Modified;

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!_context.Mission.Any(e => e.Id == id)) return NotFound();
                    else throw;
                }

                return Ok(new { message = "任務更新成功！" });
            }

            // 補上刪除任務
            [HttpDelete("{id}")]
            [Authorize(Roles = "Admin")]
            public async Task<IActionResult> DeleteMission(int id)
            {
                var mission = await _context.Mission.FindAsync(id);
                if (mission == null) return NotFound();

                _context.Mission.Remove(mission);
                await _context.SaveChangesAsync();

                return Ok(new { message = "任務已刪除！" });
            }
        }
    }