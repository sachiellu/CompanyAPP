using Microsoft.EntityFrameworkCore;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Text.Json;
using System.Security.Claims;

namespace CompanyAPP.Data
{
    public class CompanyAppContext : IdentityDbContext
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CompanyAppContext(DbContextOptions<CompanyAppContext> options, IHttpContextAccessor httpContextAccessor)
            : base(options)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public DbSet<Company> Company { get; set; } = default!;
        public DbSet<Employee> Employee { get; set; } = default!;
        public DbSet<Mission> Mission { get; set; } = default!;
        public DbSet<AuditLog> AuditLogs { get; set; } = default!;
        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            // 在資料真正寫入資料庫「之前」，先計算出這筆資料哪裡變了
            var auditEntries = OnBeforeSaveChanges();
            // 執行原本的存檔 (這時候資料庫產生了新的 ID)
            var result = await base.SaveChangesAsync(cancellationToken);
            // 在資料寫入「之後」，把剛剛缺少的 ID 補進去，並把 Log 寫入資料庫
            await OnAfterSaveChanges(auditEntries);
            return result;
        }
        private List<AuditEntry> OnBeforeSaveChanges()
        {
            ChangeTracker.DetectChanges();
            var auditEntries = new List<AuditEntry>();
            // 嘗試取得目前登入者資訊
            var user = _httpContextAccessor.HttpContext?.User;
            var userName = user?.Identity?.Name ?? "Anonymous"; // 沒登入就顯示匿名
            var userId = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Unknown";
            foreach (var entry in ChangeTracker.Entries())
            {
                // 如果是 AuditLog 自己，或是沒變動的，甚至是 Detached (沒追蹤) 的，都跳過
                if (entry.Entity is AuditLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                    continue;

                var auditEntry = new AuditEntry(entry)
                {
                    TableName = entry.Entity.GetType().Name,
                    UserId = userId,
                    UserName = userName,
                    Action = entry.State.ToString()
                };

                auditEntries.Add(auditEntry);

                foreach (var property in entry.Properties)
                {
                    string propertyName = property.Metadata.Name;

                    if (property.IsTemporary)
                    {
                        // 針對新增資料：ID 這時候還沒產生，先標記起來，存檔後再填
                        auditEntry.TemporaryProperties.Add(property);
                        continue;
                    }

                    switch (entry.State)
                    {
                        case EntityState.Added:
                            auditEntry.NewValues[propertyName] = property.CurrentValue;
                            break;

                        case EntityState.Deleted:
                            auditEntry.OldValues[propertyName] = property.OriginalValue;
                            break;

                        case EntityState.Modified:
                            if (property.IsModified)
                            {
                                auditEntry.OldValues[propertyName] = property.OriginalValue;
                                auditEntry.NewValues[propertyName] = property.CurrentValue;
                            }
                            break;
                    }
                }
            }
            // 對於那些「不是新增」的操作(也就是已經有 ID 的)，先轉成 Log 物件準備好
            foreach (var auditEntry in auditEntries.Where(e => !e.HasTemporaryProperties))
            {
                AuditLogs.Add(auditEntry.ToAuditLog());
            }

            // 回傳那些「還欠 ID」的新增資料紀錄，留給 After 處理
            return auditEntries.Where(e => e.HasTemporaryProperties).ToList();
        }

        private Task OnAfterSaveChanges(List<AuditEntry> auditEntries)
        {
            if (auditEntries == null || auditEntries.Count == 0)
                return Task.CompletedTask;

            foreach (var auditEntry in auditEntries)
            {
                // 這時候資料庫已經產生 ID 了，補填進去
                foreach (var prop in auditEntry.TemporaryProperties)
                {
                    if (prop.Metadata.IsPrimaryKey())
                    {
                        auditEntry.KeyValues[prop.Metadata.Name] = prop.CurrentValue;
                    }
                    else
                    {
                        auditEntry.NewValues[prop.Metadata.Name] = prop.CurrentValue;
                    }
                }

                // 加入 AuditLog
                AuditLogs.Add(auditEntry.ToAuditLog());
            }

            // 再存一次 (這次是為了存 Log)
            return base.SaveChangesAsync();
        }
    }

    // --- 輔助類別 (Helper) ---
    // 這只是一個暫存容器，用來把資料整理成 JSON
    public class AuditEntry
    {
        public AuditEntry(EntityEntry entry)
        {
            Entry = entry;
        }
        public EntityEntry Entry { get; }
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string TableName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public Dictionary<string, object> KeyValues { get; } = new Dictionary<string, object>();
        public Dictionary<string, object> OldValues { get; } = new Dictionary<string, object>();
        public Dictionary<string, object> NewValues { get; } = new Dictionary<string, object>();
        public List<PropertyEntry> TemporaryProperties { get; } = new List<PropertyEntry>();
        public bool HasTemporaryProperties => TemporaryProperties.Any();

        public AuditLog ToAuditLog()
        {
            var audit = new AuditLog
            {
                UserId = UserId,
                UserName = UserName,
                EntityName = TableName,
                Action = Action,
                Timestamp = DateTime.UtcNow,
                // 把 ID 字典轉成 JSON 字串 (例如: {"Id": 5})
                KeyValues = JsonSerializer.Serialize(KeyValues),
                // 決定 Changes 欄位要存什麼
                Changes = Action == "Modified"
                    ? JsonSerializer.Serialize(new { Old = OldValues, New = NewValues }) // 修改存新舊對照
                    : JsonSerializer.Serialize(NewValues.Count > 0 ? NewValues : OldValues) // 新增存新值，刪除存舊值
            };
            return audit;
        }
    }
}