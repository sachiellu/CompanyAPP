using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore; // 記得引用這個才能用 FirstOrDefaultAsync
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CompanyAPP.Controllers.Api
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly CompanyAppContext _context; // 修正 1: 注入資料庫 Context

        public AuthController(
            UserManager<IdentityUser> userManager,
            IConfiguration configuration,
            CompanyAppContext context)
        {
            _userManager = userManager;
            _configuration = configuration;
            _context = context;
        }

        // 修正 2: 定義 RegisterDto
        public class RegisterDto
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            // 1. 先確認這名員工在不在你的列表中
            var employee = await _context.Employee.FirstOrDefaultAsync(e => e.Email == dto.Email);
            if (employee == null) return BadRequest(new { message = "員工資料未建檔，請聯繫管理員。" });

            // 2. 處理 IdentityUser (Identity 資料庫)
            var user = await _userManager.FindByEmailAsync(dto.Email);

            if (user == null)
            {
                // 如果是全新的
                user = new IdentityUser { UserName = dto.Email, Email = dto.Email };
                var result = await _userManager.CreateAsync(user, dto.Password);
                if (!result.Succeeded) return BadRequest(result.Errors);
            }
            else
            {
                // 解決「邏輯打架」：如果帳號已存在（可能是之前註冊中斷或管理員預創）
                // 我們直接重設密碼完成開通
                var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
                await _userManager.ResetPasswordAsync(user, resetToken, dto.Password);
            }

            // 3. 重點：完成綁定與狀態轉換
            user.EmailConfirmed = true;
            await _userManager.UpdateAsync(user);

            employee.UserId = user.Id;           // 綁定 UserId
            employee.Status = Employee.EmployeeStatus.Active; // 將「待註冊」改為「Active」

            await _context.SaveChangesAsync();

            return Ok(new { message = "帳號已成功開通，身分已綁定！" });
        }

        public class LoginDto { public string Email { get; set; } = string.Empty; public string Password { get; set; } = string.Empty; }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
            {
                var userRoles = await _userManager.GetRolesAsync(user);
                var authClaims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, user.UserName ?? ""),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                };

                foreach (var role in userRoles)
                {
                    authClaims.Add(new Claim(ClaimTypes.Role, role));
                }

                var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:Key"] ?? "YourDefaultKeyThatIsLongEnough"));

                // JwtSecurityToken 定義區塊
                var token = new JwtSecurityToken(
                    issuer: _configuration["JwtSettings:Issuer"],
                    audience: _configuration["JwtSettings:Issuer"], // 建議跟 Issuer 設一樣
                    expires: DateTime.Now.AddDays(7),
                    claims: authClaims,
                    signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
                );

                var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

                Response.Cookies.Append("X-Access-Token", tokenString, new CookieOptions
                {
                    HttpOnly = true,       // 呼應在 Program.cs 的限制，JS 拿不到
                    Secure = true,        // 呼應在 Program.cs 的限制，沒 HTTPS 不傳
                    SameSite = SameSiteMode.None,
                    Expires = DateTimeOffset.UtcNow.AddDays(7) // 這裡決定留存時間
                });

                return Ok(new
                {
                    message = "登入成功",
                    role = userRoles.FirstOrDefault(), // 不再回傳 token 字串了！
                    token = "cookie-mode",              // 主要是為了騙過檢查 localStorage 的前端邏輯
                    email = user.Email

                });
            }
            return Unauthorized(new { message = "帳號或密碼錯誤" });
        }
    }
}