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
            var user = new IdentityUser { UserName = dto.Email, Email = dto.Email };
            var result = await _userManager.CreateAsync(user, dto.Password);

            if (result.Succeeded)
            {
                // --- Stage 2 核心邏輯：綁定員工 ---
                var employee = await _context.Employee
                    .FirstOrDefaultAsync(e => e.Email == dto.Email && e.Status == Employee.EmployeeStatus.Unregistered);

                if (employee != null)
                {
                    employee.UserId = user.Id;
                    employee.Status = Employee.EmployeeStatus.Active;
                    await _context.SaveChangesAsync();
                }

                return Ok(new { message = "註冊成功且身分已自動綁定" });
            }
            return BadRequest(result.Errors);
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

                var token = new JwtSecurityToken(
                    issuer: _configuration["JwtSettings:Issuer"],
                    audience: _configuration["JwtSettings:Audience"],
                    expires: DateTime.Now.AddHours(3),
                    claims: authClaims,
                    signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
                );

                // 修正 3: 同時回傳 token 和主要的 Role，方便前端 React 判斷
                return Ok(new
                {
                    token = new JwtSecurityTokenHandler().WriteToken(token),
                    role = userRoles.FirstOrDefault() ?? "User", // 取第一個角色作為主要身分
                    email = user.Email
                });
            }
            return Unauthorized(new { message = "帳號或密碼錯誤" });
        }
    }
}