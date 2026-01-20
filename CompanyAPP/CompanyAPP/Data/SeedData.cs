using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;


namespace CompanyAPP.Data
{
    public static class SeedData
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<IdentityUser>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var configuration = serviceProvider.GetRequiredService<IConfiguration>();

            // 1. 確保角色存在
            string[] roleNames = { "Admin", "Manager", "User" };
            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }

            // 2. 讀取設定檔中的管理員資訊 (避免寫死在程式碼)
            // 如果 appsettings 沒設，就用後面那個預設值
            var adminEmail = configuration["AdminSettings:Email"] ?? "admin@default.com";
            var adminPwd = configuration["AdminSettings:Password"] ?? "Admin123!";

            // 3. 檢查管理員是否存在
            var adminUser = await userManager.FindByEmailAsync(adminEmail);

            if (adminUser == null)
            {
                // 建立一個新的最高管理權限帳戶，並直接設為已驗證
                var newAdmin = new IdentityUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    EmailConfirmed = true 
                };

                var createResult = await userManager.CreateAsync(newAdmin, adminPwd);

                if (createResult.Succeeded)
                {
                    await userManager.AddToRoleAsync(newAdmin, "Admin");
                }
            }
            else
            {
                // 已有既有資料庫,補上權限與驗證狀態

                // 補權限
                if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }

                // 補驗證 (特赦既有的 Admin)
                if (!adminUser.EmailConfirmed)
                {
                    adminUser.EmailConfirmed = true;
                    await userManager.UpdateAsync(adminUser);
                }
            }
        }
    }
}