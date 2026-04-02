using CompanyAPP.Data;
using CompanyAPP.Models;
using CompanyAPP.Services.Common;
using Microsoft.EntityFrameworkCore;

namespace CompanyAPP.Services.Missions
{
    public class MissionService : IMissionService
    {
        private readonly CompanyAppContext _context;
        private readonly AuditService _auditService;

        public MissionService(CompanyAppContext context, AuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        public async Task<IEnumerable<Mission>> GetAllAsync()
        {
            return await _context.Mission
                .Include(m => m.Company)
                .Include(m => m.Employee)
                .OrderByDescending(m => m.CreateDate)
                .ToListAsync();
        }

        public async Task<Mission?> GetByIdAsync(int id)
        {
            return await _context.Mission
                .Include(m => m.Company)
                .Include(m => m.Employee)
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task AddAsync(Mission mission)
        {
            // 🚨 邏輯歸位：建立日期應該由 Service 負責，而不是 Controller
            mission.CreateDate = DateTime.UtcNow;

            _context.Mission.Add(mission);
            await _context.SaveChangesAsync();

            await _auditService.LogAsync("Mission", "Create", $"Id: {mission.Id}", $"指派新任務: {mission.Title}");
        }

        public async Task UpdateAsync(Mission updatedMission)
        {
            // 🚨 修正：使用跟 Company 一樣的安全更新邏輯
            var existing = await _context.Mission.FindAsync(updatedMission.Id);
            if (existing != null)
            {
                existing.Title = updatedMission.Title;
                existing.Description = updatedMission.Description;
                existing.Deadline = updatedMission.Deadline;
                existing.Status = updatedMission.Status;
                existing.EmployeeId = updatedMission.EmployeeId;
                existing.CompanyId = updatedMission.CompanyId;

                await _context.SaveChangesAsync();

                await _auditService.LogAsync("Mission", "Update", $"Id: {existing.Id}", $"更新了任務內容: {existing.Title}");
            }
        }

        public async Task DeleteAsync(int id)
        {
            var mission = await _context.Mission.FindAsync(id);
            if (mission != null)
            {
                string title = mission.Title;
                _context.Mission.Remove(mission);
                await _context.SaveChangesAsync();

                await _auditService.LogAsync("Mission", "Delete", $"Id: {id}", $"刪除了任務: {title}");
            }
        }
    }
}