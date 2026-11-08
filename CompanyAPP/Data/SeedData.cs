using CompanyAPP.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;

namespace CompanyAPP.Data
{
    public static class SeedData
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<IdentityUser>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var context = serviceProvider.GetRequiredService<CompanyAppContext>();
            var env = serviceProvider.GetRequiredService<IHostEnvironment>();

            // 1. 確保所有角色存在
            string[] roleNames = { "Admin", "Manager", "User" };
            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }

            // 2. 預設帳號只在本機建立，避免雲端用公開密碼開出管理員
            if (!env.IsDevelopment())
            {
                return;
            }

            var adminEmail = "admin@default.com";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                var newAdmin = new IdentityUser { UserName = adminEmail, Email = adminEmail, EmailConfirmed = true, LockoutEnabled = true };
                var result = await userManager.CreateAsync(newAdmin, "Admin123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(newAdmin, "Admin");
                }
            }
            else
            {
                var resetToken = await userManager.GeneratePasswordResetTokenAsync(adminUser);
                await userManager.ResetPasswordAsync(adminUser, resetToken, "Admin123!");
                if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
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

            // 4. 本機示範廠商（派工頁需 CompanyId 外鍵）
            var demoCompany = await context.Company.FirstOrDefaultAsync(c => c.Name == "示範廠商");
            if (demoCompany == null)
            {
                demoCompany = new Company
                {
                    Name = "示範廠商",
                    Category = Company.CompanyCategory.Client,
                    TaxId = "00000000",
                    Industry = "示範"
                };
                context.Company.Add(demoCompany);
                await context.SaveChangesAsync();
            }

            // 5. 確保「一般員工」在 Employee 資料表也有檔案 (否則登入後會報錯)
            var existingUser = await userManager.FindByEmailAsync(userEmail);
            if (existingUser != null)
            {
                var empProfile = await context.Employee.FirstOrDefaultAsync(e => e.Email == userEmail);
                if (empProfile == null)
                {
                    context.Employee.Add(new Employee
                    {
                        Name = "示範員工",
                        Email = userEmail,
                        UserId = existingUser.Id,
                        CompanyId = demoCompany.Id,
                        Status = Employee.EmployeeStatus.Active,
                        StaffId = "DEMO001"
                    });
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}