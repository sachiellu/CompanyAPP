// Services/AuditService.cs
using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Http; // 需要注入 IHttpContextAccessor
using System.Security.Claims;

namespace CompanyAPP.Services.Common
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
        public virtual async Task LogAsync(string entityName, string action, string keyValues, string changes)
        {
            // 獲取當前用戶資訊 (這是 Who/誰在操作 的關鍵)
            var user = _httpContextAccessor.HttpContext?.User;
            var authenticated = user?.Identity?.IsAuthenticated == true;
            var userId = authenticated
                ? (user!.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "系統")
                : "系統";
            var userName = authenticated
                ? (user!.FindFirst(ClaimTypes.Email)?.Value
                    ?? user.Identity?.Name
                    ?? "系統自動")
                : "系統自動";

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