using CompanyAPP.Models;
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
            var context = serviceProvider.GetRequiredService<CompanyAppContext>();

            // 1. 確保所有角色存在
            string[] roleNames = { "Admin", "Manager", "User" };
            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }

            // 2. 建立管理員 (admin@default.com)
            var adminEmail = "admin@default.com";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                var newAdmin = new IdentityUser { UserName = adminEmail, Email = adminEmail, EmailConfirmed = true };
                var result = await userManager.CreateAsync(newAdmin, "Admin123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(newAdmin, "Admin");
                }
            }

            // 3. 建立一般員工 (user@default.com)
            var userEmail = "user@default.com";
            var normalUser = await userManager.FindByEmailAsync(userEmail);
            if (normalUser == null)
            {
                var newUser = new IdentityUser { UserName = userEmail, Email = userEmail, EmailConfirmed = true };
                var result = await userManager.CreateAsync(newUser, "User123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(newUser, "User");
                }
                normalUser = newUser; // 讓後面的員工綁定邏輯可以拿到 ID
            }

            // 4. 關鍵：確保「一般員工」在 Employee 資料表也有檔案 (否則登入後會報錯)
            // 這裡抓出剛才建立或已存在的 User
            var existingUser = await userManager.FindByEmailAsync(userEmail);
            if (existingUser != null)
            {
                // 檢查 Employee 表是否有這名員工，沒有就補上
                var empProfile = await context.Employee.FirstOrDefaultAsync(e => e.Email == userEmail);
                if (empProfile == null)
                {
                    context.Employee.Add(new Employee
                    {
                        Name = "示範員工",
                        Email = userEmail,
                        UserId = existingUser.Id, // 綁定 Identity ID
                        Status = Employee.EmployeeStatus.Active,
                        StaffId = "DEMO001"
                    });
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}