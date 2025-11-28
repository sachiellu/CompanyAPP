using CompanyAPP;
using CompanyAPP.Data;
using Microsoft.AspNetCore.Identity; // 1. 引用 Identity
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var connectionString = builder.Configuration.GetConnectionString("CompanyAppContext") ?? throw new InvalidOperationException("Connection string 'CompanyAppContext' not found.");

builder.Services.AddDbContext<CompanyAppContext>(options =>
    options.UseSqlite(connectionString));

// ==========================================
// 註冊 Identity 服務
// ==========================================
// 這裡要把 RequireConfirmedAccount 改成 false，
// 這樣你註冊完就可以直接登入，不用搞 Email 驗證 (不然你會被卡住)

 builder.Services.AddDefaultIdentity<IdentityUser>(options =>
 {
     options.SignIn.RequireConfirmedAccount = false; // 不需要 Email 驗證

     // ★ 順便教你：如果你覺得密碼要符號很煩，可以在這裡關掉它
     options.Password.RequireNonAlphanumeric = false; // 設為 false 就不會強制要符號了
     options.Password.RequireUppercase = true;       // 設為 false 就不強制大寫
 })
    .AddRoles<IdentityRole>()
    .AddErrorDescriber<CustomIdentityErrorDescriber>()
    .AddEntityFrameworkStores<CompanyAppContext>();

builder.Services.AddControllersWithViews();

var app = builder.Build();

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
// 因為登入頁面是 Razor Page，沒有這一行，登入頁會打不開
app.MapRazorPages();

// === 自動建立 Admin 帳號 (Seed Data)  ===
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();

    // 1. 確保有 Admin 和 User 角色
    string[] roleNames = { "Admin", "User" };
    foreach (var roleName in roleNames)
    {
        if (!await roleManager.RoleExistsAsync(roleName))
        {
            await roleManager.CreateAsync(new IdentityRole(roleName));
        }
    }

    // 2. 指定一個超級管理員 (請改成你自己的 Email)
    string adminEmail = "abccmick@gmail.com"; // <--- 這裡改成你剛剛註冊的帳號
    var adminUser = await userManager.FindByEmailAsync(adminEmail);

    if (adminUser != null)
    {
        // 如果這個人存在，而且還不是 Admin，就給他 Admin 權限
        if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }
    }
}
// =================================================


app.Run();