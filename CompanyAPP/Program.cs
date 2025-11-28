using CompanyAPP;
using CompanyAPP.Data;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 雙軌路徑判斷
var dbPath = Environment.GetEnvironmentVariable("DATABASE_PATH");
var connectionString = "";

if (!string.IsNullOrEmpty(dbPath))
{
    // 雲端：使用環境變數設定的路徑 (e.g. /data/company.db)
    connectionString = $"Data Source={dbPath}";
}
else
{
    // 本地：使用 appsettings.json 的連線字串 (指向本地的路徑)
    connectionString = builder.Configuration.GetConnectionString("CompanyAppContext")
                       ?? throw new InvalidOperationException("Connection string not found.");
}

builder.Services.AddDbContext<CompanyAppContext>(options =>
    options.UseSqlite(connectionString));

// === 新增：持久化 Data Protection Keys ===
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo("/data/keys"))
    .SetApplicationName("CompanyAPP");

// ==========================================
// 註冊 Identity 服務
// ==========================================
// 要把 RequireConfirmedAccount 改成 false，
// 這樣註冊完就可以直接登入，不用搞 Email 驗證 

builder.Services.AddDefaultIdentity<IdentityUser>(options =>
 {
     options.SignIn.RequireConfirmedAccount = false;


     options.Password.RequireNonAlphanumeric = false; // 設為 false 不強制符號
     options.Password.RequireUppercase = true;       // 設為 false 不強制大寫
 })
    .AddRoles<IdentityRole>()
    .AddErrorDescriber<CustomIdentityErrorDescriber>()
    .AddEntityFrameworkStores<CompanyAppContext>();

builder.Services.AddControllersWithViews();

var app = builder.Build();

// === 整合 Migration 與 Seed Data (Migration 先，然後 Seed Data) ===
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<CompanyAppContext>();
        // 1. 資料庫遷移
        context.Database.Migrate();

        // 2. 角色與管理員 Seed Data (放在 Migrate 後面)
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<IdentityUser>>();

        string[] roleNames = { "Admin", "User" };
        foreach (var roleName in roleNames)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
            }
        }

        string adminEmail = "abccmick@gmail.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser != null)
        {
            if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }
    }
    catch (Exception ex)
    {
        // 處理錯誤
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "資料庫操作失敗 (遷移或 Seed Data)");
    }
}


// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}
app.UseStaticFiles();

app.UseRouting();

// ==========================================
// 啟動權限驗證
// ==========================================
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// ==========================================
// 加入 Razor Pages 路由
// ==========================================

app.MapRazorPages();

app.Run();