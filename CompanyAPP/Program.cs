using CompanyAPP;
using CompanyAPP.Data;
using CompanyAPP.Services.Common;
using CompanyAPP.Services.Companies;
using CompanyAPP.Services.Employees;
using CompanyAPP.Services.Missions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services; // IEmailSender 所在的命名空間
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 0. 定義全域變數 (Key 設定區)
// ==========================================
// 請確保這裡的 Key 跟 AuthController 裡的一模一樣
var jwtKey = builder.Configuration["JwtSettings:Key"]
             ?? throw new InvalidOperationException("JWT Key is missing in appsettings.json");
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"];
// var jwtAudience = builder.Configuration["JwtSettings:Audience"]; // 如果有需要驗證 Audience

// ==========================================
// 1. 資安加固：隱藏伺服器資訊
// ==========================================
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.AddServerHeader = false;
});

// ==========================================
// 2. 資料庫路徑與連線字串判斷
// ==========================================
var dbPath = Environment.GetEnvironmentVariable("DATABASE_PATH");
var connectionString = "";

if (!string.IsNullOrEmpty(dbPath))
{
    // 雲端環境
    connectionString = $"Data Source={dbPath}";
}
else
{
    // 本地環境
    connectionString = builder.Configuration.GetConnectionString("CompanyAppContext")
                       ?? throw new InvalidOperationException("Connection string not found.");
}

builder.Services.AddHttpContextAccessor();

// ==========================================
// 3. 註冊應用程式服務 (DI)
// ==========================================
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<AuditService>();
builder.Services.AddScoped<IImageService, ImageService>();
builder.Services.AddScoped<ICompanyService, CompanyService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IEmployeeExcelService, EmployeeExcelService>();
builder.Services.AddScoped<IMissionService, MissionService>();


builder.Services.AddDbContext<CompanyAppContext>(options =>
    options.UseSqlite(connectionString));


// ==========================================
// 4. CORS 服務 (AllowAll 配合 JWT)
// ==========================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173", "https://companyapp-luyu.fly.dev")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials(); // 必須允許傳送憑據(Cookie)
        });
});

// ==========================================
// 5. Data Protection (金鑰保存)
// ==========================================
if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_PATH")))
{
    builder.Services.AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo("/data/keys"))
        .SetApplicationName("CompanyAPP");
}

// ==========================================
// 6. Identity 身分驗證與 JWT 設定 (關鍵整合區)
// ==========================================
builder.Services.AddDefaultIdentity<IdentityUser>(options =>
{
    options.SignIn.RequireConfirmedAccount = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Lockout.AllowedForNewUsers = true;
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
})
    .AddRoles<IdentityRole>()
    .AddErrorDescriber<CustomIdentityErrorDescriber>()
    .AddEntityFrameworkStores<CompanyAppContext>();

builder.Services.AddTransient<IEmailSender, EmailSender>();
// 設定 Cookie 安全性 (給 Razor Pages 用)
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.ExpireTimeSpan = TimeSpan.FromDays(7); // 留存 7 天cookies
    options.SlidingExpiration = true;             // 「滑動過期」：只要有操作，就自動幫你再續 7 天

});

// 整合 JWT 設定到 Authentication Pipeline 
// 這裡同時設定了預設驗證方案為 JWT，確保 API 優先使用 Token
builder.Services.AddAuthentication(options =>
{
    // 讓系統預設先檢查 JWT，這樣才不會一直導向 Login 頁面
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtIssuer,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };

    // 這裡是用來攔截錯誤，防止回傳 HTML 的關鍵
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            // 從剛才設定的 Cookie 名稱 "X-Access-Token" 讀取
            var accessToken = context.Request.Cookies["X-Access-Token"];
            if (!string.IsNullOrEmpty(accessToken))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        },

        OnChallenge = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                return context.Response.WriteAsync("{\"error\": \"Unauthorized: Token missing or invalid\"}");
            }

            // 如果是首頁或前端路由，不執行 HandleResponse，讓它流向後面的 MapFallbackToFile
            return Task.CompletedTask;
        }
    };
});

// ==========================================
// 7. Controller 設定 (解決 JSON 迴圈)
// ==========================================
builder.Services.AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;

        //轉換前後端大小寫對應
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// ==========================================
// 8. Swagger 文件
// ==========================================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ==========================================
// 9. Middleware Pipeline 設定
// ==========================================

// Fly.io 代理設定
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});


// Seed Data 初始化
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

// HTTP Headers & CSP
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Remove("Server");
    context.Response.Headers.Remove("X-Powered-By");

    // ============================================================
    // 修正：Content Security Policy (CSP)
    // 我們需要允許 img-src 去連 Cloudinary 的伺服器 (*.cloudinary.com)
    // 這樣瀏覽器才不會擋掉上傳成功的圖片。   
    // ============================================================
    string csp = "default-src 'self'; " +
                 "script-src 'self'; " + // SPA 必備
                 "style-src 'self'; " +  // CSS 必備
                 "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com; " +
                 "connect-src 'self'; " + // API 連線
                 "font-src 'self'; " +
                 "object-src 'none'; " +
                 "base-uri 'self';";


    context.Response.Headers.Append("Content-Security-Policy", csp);

    await next();
});

// 錯誤處理與 HSTS
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler(appBuilder =>
    {
        appBuilder.Run(async context =>
        {
            context.Response.StatusCode = 500;
            await context.Response.WriteAsync("Server Error");
        });
    });
    app.UseHsts();
}


app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();

// 關鍵修改：啟用 CORS 和 Authentication (順序不能錯)
app.UseCors("AllowAll"); // 先開門
app.UseAuthentication(); // 再驗身分 (JWT 生效處)
app.UseAuthorization();  // 最後授權

app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();

app.MapFallbackToFile("index.html").AllowAnonymous();

app.Run();