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
    // 雲端
    connectionString = $"Data Source={dbPath}";
}
else
{
    // 本地
    connectionString = builder.Configuration.GetConnectionString("CompanyAppContext")
                       ?? throw new InvalidOperationException("Connection string not found.");
}

// 註冊發信服務
builder.Services.AddTransient<Microsoft.AspNetCore.Identity.UI.Services.IEmailSender, CompanyAPP.Services.EmailSender>();

builder.Services.AddDbContext<CompanyAppContext>(options =>
    options.UseSqlite(connectionString));

// 只有在雲端 (有設定 DATABASE_PATH 環境變數) 時，才設定 Key 的儲存路徑
// 在本機電腦開發時，直接使用預設設定 (存到暫存資料夾)，不然會報錯
if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_PATH")))
{
    builder.Services.AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo("/data/keys"))
        .SetApplicationName("CompanyAPP");
}

// Identity 設定
builder.Services.AddDefaultIdentity<IdentityUser>(options =>
 {
     options.SignIn.RequireConfirmedAccount = true;
     options.Password.RequireNonAlphanumeric = false; // 設為 false 不強制符號
     options.Password.RequireUppercase = true;       // 設為 false 不強制大寫
 })
    .AddRoles<IdentityRole>()
    .AddErrorDescriber<CustomIdentityErrorDescriber>()
    .AddEntityFrameworkStores<CompanyAppContext>();

builder.Services.AddControllersWithViews();
var app = builder.Build();

// 整合 Migration 與 Seed Data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        // 1. 資料庫遷移 (確保 DB 結構是最新的)
        var context = services.GetRequiredService<CompanyAppContext>();
        context.Database.Migrate();

        // 2. 執行種子資料初始化 (呼叫 SeedData)
        await SeedData.InitializeAsync(services);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "系統初始化失敗 (Migration 或 Seed Data 錯誤)");
    }
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}
app.UseStaticFiles();
app.UseRouting();

// 啟動權限驗證
app.UseAuthorization();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// 加入 Razor Pages 路由
app.MapRazorPages();

app.Run();