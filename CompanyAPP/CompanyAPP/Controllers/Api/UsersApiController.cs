using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompanyAPP.Controllers.Api
{
    [Route("api/users")]
    [ApiController]
    // 只有 Admin 才能看帳號列表和改權限
    [Authorize(Roles = "Admin")]
    public class UsersApiController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly CompanyAppContext _context;

        public UsersApiController(UserManager<IdentityUser> userManager, CompanyAppContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        // 1. 取得所有帳號與其角色
        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _userManager.Users.ToListAsync();
            var userList = new List<object>();

            foreach (var user in users)
            {
                // 取得這個帳號的角色 (可能有多個，通常我們取第一個)
                var roles = await _userManager.GetRolesAsync(user);

                // 檢查這個帳號有沒有綁定員工
                var linkedEmployee = await _context.Employee.FirstOrDefaultAsync(e => e.UserId == user.Id);

                userList.Add(new
                {
                    Id = user.Id,
                    Email = user.Email,
                    Role = roles.FirstOrDefault() ?? "User", // 預設顯示 User
                    LinkedEmployeeName = linkedEmployee?.Name ?? "尚未綁定"
                });
            }

            return Ok(userList);
        }

        // 2. 變更帳號角色
        public class ChangeRoleDto
        {
            public string UserId { get; set; } = string.Empty;
            public string NewRole { get; set; } = string.Empty;
        }

        [HttpPost("change-role")]
        public async Task<IActionResult> ChangeRole([FromBody] ChangeRoleDto dto)
        {
            var user = await _userManager.FindByIdAsync(dto.UserId);
            if (user == null) return NotFound("找不到該帳號");

            if (user.Email == "admin@default.com")
            {
                return BadRequest(new { message = "系統預設管理員帳號不可修改權限！" });
            }

            // 取得目前的角色並移除
            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);

            // 加入新角色 (前提是你的資料庫 AspNetRoles 表裡面已經建好這些 Role)
            await _userManager.AddToRoleAsync(user, dto.NewRole);

            return Ok(new { message = "權限更新成功" });
        }
    }
}