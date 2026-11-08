using CompanyAPP.Data;
using CompanyAPP.Models;
using CompanyAPP.Services.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
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
        private readonly CompanyAppContext _context;
        private readonly IHostEnvironment _env;

        public AuthController(
            UserManager<IdentityUser> userManager,
            IConfiguration configuration,
            CompanyAppContext context,
            IHostEnvironment env)
        {
            _userManager = userManager;
            _configuration = configuration;
            _context = context;
            _env = env;
        }

        // 修正 2: 定義 RegisterDto
        public class RegisterDto
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string Token { get; set; } = string.Empty;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Token))
                return BadRequest(new { message = "請使用邀請信中的連結開通帳號。" });

            var employee = await _context.Employee.FirstOrDefaultAsync(e => e.Email == dto.Email);
            if (employee == null) return BadRequest(new { message = "員工資料未建檔，請聯繫管理員。" });
            if (employee.Status == Employee.EmployeeStatus.Active)
                return BadRequest(new { message = "此帳號已開通，請直接登入。" });
            if (employee.InviteExpiresAt is null || employee.InviteExpiresAt < DateTime.UtcNow)
                return BadRequest(new { message = "邀請已過期，請管理員重寄邀請信。" });
            if (!InviteToken.Matches(dto.Token, employee.InviteTokenHash))
                return BadRequest(new { message = "邀請連結無效。" });

            var user = await _userManager.FindByEmailAsync(dto.Email);

            if (user == null)
            {
                user = new IdentityUser { UserName = dto.Email, Email = dto.Email, LockoutEnabled = true };
                var result = await _userManager.CreateAsync(user, dto.Password);
                if (!result.Succeeded) return BadRequest(result.Errors);
            }
            else
            {
                var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
                await _userManager.ResetPasswordAsync(user, resetToken, dto.Password);
            }

            // 3. 重點：完成綁定與狀態轉換
            user.EmailConfirmed = true;
            await _userManager.UpdateAsync(user);

            employee.UserId = user.Id;
            employee.Status = Employee.EmployeeStatus.Active;
            employee.InviteTokenHash = null;
            employee.InviteExpiresAt = null;

            await _context.SaveChangesAsync();

            return Ok(new { message = "帳號已成功開通，身分已綁定！" });
        }

        public class LoginDto { public string Email { get; set; } = string.Empty; public string Password { get; set; } = string.Empty; }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return Unauthorized(new { message = "帳號或密碼錯誤" });

            if (!user.LockoutEnabled)
            {
                user.LockoutEnabled = true;
                await _userManager.UpdateAsync(user);
            }

            if (await _userManager.IsLockedOutAsync(user))
                return Unauthorized(new { message = "嘗試次數過多，請 5 分鐘後再試" });

            if (!await _userManager.CheckPasswordAsync(user, model.Password))
            {
                await _userManager.AccessFailedAsync(user);
                return Unauthorized(new { message = "帳號或密碼錯誤" });
            }

            await _userManager.ResetAccessFailedCountAsync(user);

            var userRoles = await _userManager.GetRolesAsync(user);
            var jwtKey = _configuration["JwtSettings:Key"];
            if (string.IsNullOrWhiteSpace(jwtKey))
                throw new InvalidOperationException("JWT Key is missing.");

            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName ?? ""),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            foreach (var role in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, role));
            }

            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var token = new JwtSecurityToken(
                issuer: _configuration["JwtSettings:Issuer"],
                audience: _configuration["JwtSettings:Issuer"],
                expires: DateTime.UtcNow.AddDays(7),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            Response.Cookies.Append("X-Access-Token", tokenString, AccessTokenCookieOptions(DateTimeOffset.UtcNow.AddDays(7)));

            return Ok(new
            {
                message = "登入成功",
                role = userRoles.FirstOrDefault(),
                token = "cookie-mode",
                email = user.Email
            });
        }

        [HttpPost("logout")]
        [AllowAnonymous]
        public IActionResult Logout()
        {
            Response.Cookies.Append("X-Access-Token", string.Empty, AccessTokenCookieOptions(DateTimeOffset.UnixEpoch));
            return Ok(new { message = "已登出" });
        }

        private CookieOptions AccessTokenCookieOptions(DateTimeOffset expires) => new()
        {
            HttpOnly = true,
            Secure = !_env.IsDevelopment(),
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = expires
        };
    }
}