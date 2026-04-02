using CompanyAPP.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[Route("api/audit-logs")]
[ApiController]
[Authorize(Roles = "Admin")] // 只有管理員能看
public class AuditLogsController : ControllerBase
{
    private readonly CompanyAppContext _context;
    public AuditLogsController(CompanyAppContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetLogs()
    {
        // 抓取最新的 100 筆，使用 UtcNow 存檔的資料
        var logs = await _context.AuditLogs
            .OrderByDescending(x => x.Timestamp)
            .Take(100)
            .ToListAsync();
        return Ok(logs);
    }
}