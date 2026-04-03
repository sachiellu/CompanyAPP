// src/Controllers/Api/MissionsApiController.cs

using CompanyAPP.Data;
using CompanyAPP.Dtos.Missions;
using CompanyAPP.Models;
using CompanyAPP.Services.Common;
using CompanyAPP.Services.Missions;
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
        private readonly IMissionService _missionService;
        private readonly AuditService _auditService;

        public MissionsApiController(IMissionService missionService, AuditService auditService)
        {
            _missionService = missionService;
            _auditService = auditService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMissions()
        {
            var missions = await _missionService.GetAllAsync();
            // 這裡維持你原本的 Select 邏輯回傳給前端
            var result = missions.Select(m => new
            {
                m.Id,
                m.Title,
                m.Deadline,
                m.Status,
                CompanyName = m.Company?.Name ?? "未指定",
                EmployeeName = m.Employee?.Name ?? "未指派"
            });
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateMission([FromBody] Mission mission)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            mission.CreateDate = DateTime.UtcNow;
            await _missionService.AddAsync(mission);
            return Ok(new { message = "任務指派成功！" });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateMission(int id, [FromBody] Mission mission)
        {
            if (id != mission.Id) return BadRequest("ID 不符");
            await _missionService.UpdateAsync(mission);
            return Ok(new { message = "任務更新成功！" });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteMission(int id)
        {
            await _missionService.DeleteAsync(id);
            return Ok(new { message = "任務已刪除！" });
        }
    }
}