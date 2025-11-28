using CompanyAPP.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyAPP.Controllers
{
    [Authorize(Roles = "Admin")]
    public class UsersController : Controller
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public UsersController(UserManager<IdentityUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

         // 使用者列表
        public async Task<IActionResult> Index()
        {
            var users = await _userManager.Users.ToListAsync();
            var userRolesViewModel = new List<UserRolesViewModel>();

            foreach (var user in users)
            {
                var thisViewModel = new UserRolesViewModel();
                thisViewModel.UserId = user.Id;
                thisViewModel.Email = user.Email ?? "";
                thisViewModel.Roles = await _getUserRoles(user);
                userRolesViewModel.Add(thisViewModel);
            }
            return View(userRolesViewModel);
        }

         // 管理權限頁面
        public async Task<IActionResult> ManageRoles(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            ViewBag.UserName = user.Email;
            ViewBag.UserId = userId;

            var model = new List<ManageUserRolesViewModel>();

            if (!await _roleManager.RoleExistsAsync("Admin")) await _roleManager.CreateAsync(new IdentityRole("Admin"));
            if (!await _roleManager.RoleExistsAsync("User")) await _roleManager.CreateAsync(new IdentityRole("User"));

            foreach (var role in _roleManager.Roles)
            {
                var userRolesViewModel = new ManageUserRolesViewModel
                {
                    RoleId = role.Id,
                    RoleName = role.Name
                };

                if (await _userManager.IsInRoleAsync(user, role.Name))
                {
                    userRolesViewModel.IsSelected = true;
                }
                model.Add(userRolesViewModel);
            }
            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ManageRoles(string selectedRole, string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            if (user.Email == "abccmick@gmail.com")
            {
                return Content("禁止修改最高權限管理員權限！");
            }

            var userRoles = await _userManager.GetRolesAsync(user);
            var removeResult = await _userManager.RemoveFromRolesAsync(user, userRoles);

            if (!removeResult.Succeeded)
            {
                ModelState.AddModelError("", "移除權限失敗");
                return View("Index");
            }

            if (!string.IsNullOrEmpty(selectedRole))
            {
                var addResult = await _userManager.AddToRoleAsync(user, selectedRole);
                if (!addResult.Succeeded)
                {
                    ModelState.AddModelError("", "加入新權限失敗");
                    return RedirectToAction("Index");
                }
            }

                return RedirectToAction("Index");
        }   

        public async Task<IActionResult> Delete(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user != null)
            {
                if (user.Email == "abccmick@gmail.com")
                {
                    return Content("禁止刪除最高權限管理員！");
                }
                await _userManager.DeleteAsync(user);
            }
            return RedirectToAction(nameof(Index));
        }

        private async Task<List<string>> _getUserRoles(IdentityUser user)
        {
            return new List<string>(await _userManager.GetRolesAsync(user));
        }
    }
}