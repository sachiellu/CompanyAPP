using System.ComponentModel.DataAnnotations;

namespace CompanyAPP.Models
{
    public class AuditLog
    {
        public int Id { get; set; }

        [MaxLength(50)]
        public string UserId { get; set; } = string.Empty; // 誰做的

        public string UserName { get; set; } = string.Empty; // 用戶名 (方便查看)

        [MaxLength(100)]
        public string EntityName { get; set; } = string.Empty; // 哪個實體 (Employee, Company)

        [MaxLength(10)]
        public string Action { get; set; } = string.Empty; // 什麼操作 (Add, Modify, Delete)

        public DateTime Timestamp { get; set; } = DateTime.UtcNow; // 何時發生

        // 記錄被修改的實體ID或關鍵訊息
        public string KeyValues { get; set; } = string.Empty;

        // 記錄變更的詳細內容 (例如：JSON 格式)
        public string Changes { get; set; } = string.Empty;

    }
}

