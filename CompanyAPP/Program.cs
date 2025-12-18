using CompanyAPP;
using CompanyAPP.Data;
using CompanyAPP.Services;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. 資安加固：隱藏伺服器資訊 (解決 Server Leaks)
// ==========================================
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.AddServerHeader = false;
});

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

builder.Services.AddHttpContextAccessor();

// 註冊服務
builder.Services.AddScoped<IImageService, ImageService>();
builder.Services.AddScoped<ICompanyService, CompanyService>();
builder.Services.AddTransient<Microsoft.AspNetCore.Identity.UI.Services.IEmailSender, CompanyAPP.Services.EmailSender>();

builder.Services.AddDbContext<CompanyAppContext>(options =>
    options.UseSqlite(connectionString));

// Data Protection
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
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Lockout.AllowedForNewUsers = true; // 確保新用戶也適用鎖定機制
    options.Lockout.MaxFailedAccessAttempts = 5; // 5次錯誤鎖定
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5); // 鎖定5分鐘
})
    .AddRoles<IdentityRole>()
    .AddErrorDescriber<CustomIdentityErrorDescriber>()
    .AddEntityFrameworkStores<CompanyAppContext>();

// ==========================================
// 2. 資安加固：強制 Cookie 安全性 (解決 Cookie Without Secure Flag)
// ==========================================
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true; // 防止 XSS 竊取 Cookie
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always; // 強制 HTTPS
    options.Cookie.SameSite = SameSiteMode.Lax;
});

builder.Services.AddControllersWithViews();
var app = builder.Build();

// Fly.io 代理設定 (解決 HTTPS 誤判)
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

// Seed Data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<CompanyAppContext>();
        context.Database.Migrate();
        await SeedData.InitializeAsync(services);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "系統初始化失敗 (Migration 或 Seed Data 錯誤)");
    }
}

// ==========================================
// 3. 資安加固：HTTP Headers & CSP (解決多項 ZAP 警告)
// 這段必須放在 UseStaticFiles 之前 
// ==========================================
app.Use(async (context, next) =>
{
    // 防嗅探
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");

    // 防點擊劫持
    context.Response.Headers.Append("X-Frame-Options", "DENY");

    // 移除多餘資訊 (深度防禦)
    context.Response.Headers.Remove("Server");
    context.Response.Headers.Remove("X-Powered-By");

    await next();
});

// 錯誤處理與 HSTS
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // HSTS (解決 Strict-Transport-Security Header Not Set)
    app.UseHsts();
}

app.UseStaticFiles(); // 靜態檔案現在會受到上面的 Header 保護

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapRazorPages();

app.Run();