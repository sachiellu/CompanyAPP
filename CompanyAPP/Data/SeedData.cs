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

            string[] roleNames = { "Admin", "Manager", "User" };
            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }

            await EnsureIdentityUserAsync(userManager, "admin@default.com", "Admin123!", "Admin");
            await EnsureDemoStaffAsync(userManager, context, "user@default.com", "User123!");
        }

        private static async Task EnsureIdentityUserAsync(
            UserManager<IdentityUser> userManager,
            string email,
            string password,
            string role)
        {
            var user = await userManager.FindByEmailAsync(email);
            if (user == null)
            {
                user = new IdentityUser { UserName = email, Email = email, EmailConfirmed = true, LockoutEnabled = true };
                var created = await userManager.CreateAsync(user);
                if (!created.Succeeded)
                {
                    return;
                }
            }

            user.EmailConfirmed = true;
            user.LockoutEnabled = true;
            user.LockoutEnd = null;
            user.PasswordHash = userManager.PasswordHasher.HashPassword(user, password);
            await userManager.UpdateAsync(user);

            if (!await userManager.IsInRoleAsync(user, role))
            {
                await userManager.AddToRoleAsync(user, role);
            }
        }

        private static async Task EnsureDemoStaffAsync(
            UserManager<IdentityUser> userManager,
            CompanyAppContext context,
            string email,
            string password)
        {
            await EnsureIdentityUserAsync(userManager, email, password, "User");

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

            var existingUser = await userManager.FindByEmailAsync(email);
            if (existingUser == null)
            {
                return;
            }

            var empProfile = await context.Employee.FirstOrDefaultAsync(e => e.Email == email);
            if (empProfile == null)
            {
                context.Employee.Add(new Employee
                {
                    Name = "示範員工",
                    Email = email,
                    UserId = existingUser.Id,
                    CompanyId = demoCompany.Id,
                    Status = Employee.EmployeeStatus.Active,
                    StaffId = "DEMO001"
                });
                await context.SaveChangesAsync();
            }
            else
            {
                empProfile.UserId = existingUser.Id;
                empProfile.Status = Employee.EmployeeStatus.Active;
                await context.SaveChangesAsync();
            }
        }
    }
}