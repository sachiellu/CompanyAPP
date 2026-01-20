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
        private readonly List<string> _superAdmins = new List<string>
        {
            "admin@default.com"
        };

        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public UsersController(UserManager<IdentityUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        // 1. 使用者列表
        public async Task<IActionResult> Index()
        {
            var users = await _userManager.Users.ToListAsync();
            var userRolesViewModel = new List<UserRolesViewModel>();

            foreach (var user in users)
            {
                var thisViewModel = new UserRolesViewModel();
                thisViewModel.UserId = user.Id;
                thisViewModel.Email = user.Email ?? "";
                thisViewModel.EmailConfirmed = user.EmailConfirmed;
                thisViewModel.Roles = await _getUserRoles(user);
                userRolesViewModel.Add(thisViewModel);
            }
            return View(userRolesViewModel);
        }

        // 2. [GET] 管理權限頁面
        [HttpGet]
        public async Task<IActionResult> ManageRoles(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            ViewBag.UserId = userId;
            ViewBag.UserName = user.Email;

            var model = new List<ManageUserRolesViewModel>();

            // 確保基本角色存在 (防呆)
            if (!await _roleManager.RoleExistsAsync("Admin")) await _roleManager.CreateAsync(new IdentityRole("Admin"));
            if (!await _roleManager.RoleExistsAsync("Manager")) await _roleManager.CreateAsync(new IdentityRole("Manager"));
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

        // 3. [POST] 管理權限 (接收單選的 selectedRole)
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ManageRoles(string selectedRole, string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            // 白名單檢查
            if (_superAdmins.Contains(user.Email))
            {
                TempData["StatusMessage"] = "錯誤：禁止修改最高權限管理員！";
                return RedirectToAction(nameof(Index));
            }

            // 移除舊權限
            var userRoles = await _userManager.GetRolesAsync(user);
            var removeResult = await _userManager.RemoveFromRolesAsync(user, userRoles);

            if (!removeResult.Succeeded)
            {
                ModelState.AddModelError("", "移除權限失敗");
                    TempData["StatusMessage"] = "錯誤：移除權限失敗";
                return View("Index");
            }

            // 加入新權限
            if (!string.IsNullOrEmpty(selectedRole))
            {
                var addResult = await _userManager.AddToRoleAsync(user, selectedRole);
                if (!addResult.Succeeded)
                {
                    ModelState.AddModelError("", "加入新權限失敗");
                    return RedirectToAction(nameof(Index));
                }
            }

            TempData["StatusMessage"] = "權限更新成功！";
            return RedirectToAction(nameof(Index));
        }

        // 4. 手動開通
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> VerifyUser(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            if (user.EmailConfirmed)
            {
                TempData["StatusMessage"] = "此帳號已經是驗證狀態。";
                return RedirectToAction(nameof(Index));
            }

            user.EmailConfirmed = true;
            await _userManager.UpdateAsync(user);

            TempData["StatusMessage"] = $"成功手動開通帳號：{user.Email}";
            return RedirectToAction(nameof(Index));
        }

        // 5. 刪除
        public async Task<IActionResult> Delete(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user != null)
            {
                if (_superAdmins.Contains(user.Email))
                {
                    TempData["StatusMessage"] = "錯誤：禁止刪除最高權限管理員！";
                    return RedirectToAction(nameof(Index));
                }
                await _userManager.DeleteAsync(user);
                TempData["StatusMessage"] = "帳號刪除成功。";
            }
            return RedirectToAction(nameof(Index));
        }

        private async Task<List<string>> _getUserRoles(IdentityUser user)
        {
            return new List<string>(await _userManager.GetRolesAsync(user));
        }
    }
}