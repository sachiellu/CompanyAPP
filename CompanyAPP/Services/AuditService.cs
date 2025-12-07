// Services/AuditService.cs
using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Http; // 需要注入 IHttpContextAccessor
using System.Security.Claims;

namespace CompanyAPP.Services
{
    public class AuditService
    {
        private readonly CompanyAppContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor; // 用來取得當前用戶資訊

        public AuditService(CompanyAppContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        // 核心功能：記錄一筆日誌
        public async Task LogAsync(string entityName, string action, string keyValues, string changes)
        {
            // 獲取當前用戶資訊 (這是 Who/誰在操作 的關鍵)
            var user = _httpContextAccessor.HttpContext?.User;
            var userId = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "System/Anonymous";
            var userName = user?.FindFirst(ClaimTypes.Email)?.Value ?? "System/Anonymous";

            var log = new AuditLog
            {
                UserId = userId,
                UserName = userName,
                EntityName = entityName,
                Action = action,
                KeyValues = keyValues,
                Changes = changes,
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
        }
    }
}