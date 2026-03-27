using CompanyAPP.Services;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Identity;
using System.Linq;
using System.Threading.Tasks;

namespace CompanyAPP.Controllers.Api
{
    [Route("api/employees")]
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class EmployeesApiController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;
        private readonly IEmployeeExcelService _excelService;
        private readonly IEmailSender _emailSender;
        private readonly IConfiguration _config;
        private readonly UserManager<IdentityUser> _userManager;

        public EmployeesApiController(
            IEmployeeService employeeService,
            IEmployeeExcelService excelService,
            IEmailSender emailSender,
            IConfiguration config,
            UserManager<IdentityUser> userManager)
        {
            _employeeService = employeeService;
            _excelService = excelService;
            _emailSender = emailSender;
            _config = config;
            _userManager = userManager;
        }

        public class EmployeeDto
        {
            public string? StaffId { get; set; }
            public string? Name { get; set; }
            public string? Position { get; set; }
            public string? Email { get; set; }
            public int CompanyId { get; set; }
        }

        [HttpGet]
        public async Task<IActionResult> GetEmployees([FromQuery] string? searchString)
        {
            var emps = await _employeeService.GetAllAsync(searchString);
            var result = emps.Select(e => new
            {
                e.Id,
                e.StaffId,
                e.Name,
                e.Position,
                e.Email,
                e.Status,
                e.CompanyId,
                CompanyName = e.Company?.Name ?? "未分配"
            });
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEmployee(int id)
        {
            var emp = await _employeeService.GetByIdAsync(id);
            if (emp == null) return NotFound(new { message = "找不到員工" });
            return Ok(new
            {
                emp.Id,
                emp.StaffId,
                emp.Name,
                emp.Position,
                emp.Email,
                emp.Status,
                emp.CompanyId,
                CompanyName = emp.Company?.Name ?? "未分配"
            });
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateEmployee([FromBody] EmployeeDto dto)
        {
            if (dto == null) return BadRequest(new { message = "資料格式錯誤" });

            // 1. 檢查 Email (你原本的正確邏輯)
            if (!string.IsNullOrEmpty(dto.Email))
            {
                bool emailExists = await _employeeService.IsEmailExistAsync(dto.Email);
                if (emailExists) return BadRequest(new { message = "Email 已存在，請勿重複建立！" });
            }

            // 2. 處理 StaffId (合併你的邏輯)
            string finalStaffId = dto.StaffId ?? "";

            // 使用 IsNullOrWhiteSpace，連「只有空格」的情況也當作沒傳，觸發自動生成
            if (string.IsNullOrWhiteSpace(finalStaffId))
            {
                finalStaffId = await _employeeService.GetNextStaffIdAsync();
            }
            else
            {
                // 如果使用者有傳（且不是空白），檢查是否重複
                bool staffIdExists = await _employeeService.IsStaffIdExistAsync(finalStaffId);
                if (staffIdExists) return BadRequest(new { message = "工號已存在，請確認！" });
            }

            // 3. 建立並存檔
            var employee = new Employee
            {
                StaffId = finalStaffId,
                Name = dto.Name ?? "",
                Position = dto.Position,
                Email = dto.Email ?? "",
                CompanyId = dto.CompanyId,
                Status = Employee.EmployeeStatus.Unregistered
            };

            // 記得要呼叫 AddAsync 才會寫進資料庫
            await _employeeService.AddAsync(employee);

            // 記得要有 return Ok(...)，不然會報 CS0161 錯誤
            return Ok(new { message = "員工新增成功", staffId = finalStaffId });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateEmployee(int id, [FromBody] EmployeeDto dto)
        {
            var emp = await _employeeService.GetByIdAsync(id);
            if (emp == null) return NotFound(new { message = "找不到員工" });

            emp.Name = dto.Name ?? emp.Name;
            emp.Position = dto.Position ?? emp.Position;
            emp.StaffId = dto.StaffId ?? emp.StaffId;
            emp.CompanyId = dto.CompanyId;

            if (User.IsInRole("Admin") || emp.Status != Employee.EmployeeStatus.Active)
            {
                emp.Email = dto.Email ?? emp.Email;
            }

            await _employeeService.UpdateAsync(emp);
            return Ok(new { message = "員工更新成功" });
        }

        // 軟刪除 (Soft Delete)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            var emp = await _employeeService.GetByIdAsync(id);
            if (emp == null) return NotFound(new { message = "找不到員工" });

            emp.Status = Employee.EmployeeStatus.Disabled;
            await _employeeService.UpdateAsync(emp);

            if (!string.IsNullOrEmpty(emp.UserId))
            {
                var user = await _userManager.FindByIdAsync(emp.UserId);
                if (user != null)
                {
                    user.LockoutEnd = DateTimeOffset.MaxValue;
                    await _userManager.UpdateAsync(user);
                }
            }
            return Ok(new { message = "員工已停用，且登入權限已被鎖定" });
        }

        [HttpPost("batch-delete")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteBatch([FromBody] List<int> ids)
        {
            if (ids == null || !ids.Any()) return BadRequest(new { message = "未提供刪除 ID" });
            var count = await _employeeService.DeleteBatchAsync(ids);
            return Ok(new { message = $"成功處理 {count} 筆資料" });
        }

        [HttpPost("{id}/restore")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RestoreEmployee(int id)
        {
            var emp = await _employeeService.GetByIdAsync(id);
            if (emp == null) return NotFound(new { message = "找不到員工" });

            if (emp.Status != Employee.EmployeeStatus.Disabled)
            {
                return BadRequest(new { message = "該員工不是停用狀態，無需恢復" });
            }

            emp.Status = string.IsNullOrEmpty(emp.UserId)
                ? Employee.EmployeeStatus.Unregistered
                : Employee.EmployeeStatus.Active;

            await _employeeService.UpdateAsync(emp);

            if (!string.IsNullOrEmpty(emp.UserId))
            {
                var user = await _userManager.FindByIdAsync(emp.UserId);
                if (user != null)
                {
                    user.LockoutEnd = null;
                    await _userManager.UpdateAsync(user);
                }
            }
            return Ok(new { message = "員工已成功復職，帳號已解鎖！" });
        }

        // 徹底刪除 (物理刪除)
        [HttpDelete("{id}/hard")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> HardDeleteEmployee(int id)
        {
            var emp = await _employeeService.GetByIdAsync(id);
            if (emp == null) return NotFound(new { message = "找不到員工" });

            if (!string.IsNullOrEmpty(emp.UserId))
            {
                var user = await _userManager.FindByIdAsync(emp.UserId);
                if (user != null)
                {
                    await _userManager.DeleteAsync(user);
                }
            }
            await _employeeService.DeleteAsync(id);
            return Ok(new { message = "員工資料與登入帳號已徹底抹除！" });
        }

        // --- 新增：解決「已按刪除但在註冊時 Email 被佔用」的問題 ---
        [HttpPost("cleanup-by-email")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CleanupByEmail([FromBody] string email)
        {
            if (string.IsNullOrEmpty(email)) return BadRequest("請提供 Email");

            // 1. 刪除 Identity 帳號
            var user = await _userManager.FindByEmailAsync(email);
            if (user != null)
            {
                await _userManager.DeleteAsync(user);
            }

            // 2. 透過 Service 找出該 Email 並徹底刪除員工資料
            // 這裡假設你的 Service 有 GetAllAsync 或類似方法能抓出所有狀態的員工
            var emps = await _employeeService.GetAllAsync(null);
            var targetEmp = emps.FirstOrDefault(e => e.Email == email);

            if (targetEmp != null)
            {
                await _employeeService.DeleteAsync(targetEmp.Id);
            }

            return Ok(new { message = $"Email: {email} 的相關帳號與殘留檔案已完全清除。" });
        }

        [HttpPost("import")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Import(IFormFile excelFile)
        {
            if (excelFile == null || excelFile.Length == 0) return BadRequest(new { message = "請上傳 Excel 檔案" });

            using var stream = excelFile.OpenReadStream();
            var result = await _excelService.ImportFromExcelAsync(stream);

            return Ok(new { result.SuccessCount, result.Reports });
        }

        // ==========================================
        // 2. 真實的 Excel 匯出 (Export)
        // ==========================================
        [HttpPost("export")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Export([FromBody] List<int>? ids)
        {
            var file = await _excelService.ExportToExcelAsync(ids);

            return File(
                file,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Employees_{DateTime.Now:yyyyMMdd}.xlsx"
            );
        }

        // ==========================================
        // 3. 真實的 發送邀請信 (SendInvite)
        // ==========================================
        [HttpPost("{id}/invite")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> SendInvite(int id)
        {
            Console.WriteLine($"\n\n🚨🚨 進入 SendInvite API！ 目標 ID: {id} 🚨🚨\n\n");

            var emp = await _employeeService.GetByIdAsync(id);
            if (emp == null) return NotFound(new { message = "找不到此員工" });
            if (string.IsNullOrEmpty(emp.Email)) return BadRequest(new { message = "該員工沒有設定 Email" });
            if (emp.Status == Employee.EmployeeStatus.Active) return BadRequest(new { message = "該員工已經註冊過了" });

            // 產生前端的註冊網址
            var frontendUrl = _config["FrontendUrl"] ?? "http://localhost:5173";
            var registerLink = $"{frontendUrl}/register?email={Uri.EscapeDataString(emp.Email)}";

            // 組裝精美的信件內容
            string subject = "【企業管理系統】帳號開通邀請";
            string htmlMessage = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
                        <h2 style='color: #0d6efd;'>企業資源管理系統</h2>
                        <h3>您好，{emp.Name}：</h3>
                        <p>系統管理員已經為您建立了員工檔案。</p>
                        <p>為了讓您能夠登入系統接收任    務派工，請點擊下方按鈕完成「密碼設定」與「帳號開通」：</p>
                    
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='{registerLink}' style='padding: 12px 24px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;'>立即開通帳號</a>
                        </div>
                    
                        <p style='color: #666; font-size: 14px;'>如果您無法點擊按鈕，請複製以下網址至瀏覽器開啟：</p>
                        <p style='color: #666; font-size: 12px; word-break: break-all;'>{registerLink}</p>
                    
                        <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;' />
                        <small style='color: #999;'>此為系統自動發送之信件，請勿直接回覆。</small>
                    </div>
                ";

            Console.WriteLine($"📧 準備呼叫 EmailSender 寄信給: {emp.Email}");

            // 呼叫寄信工具發射！
            await _emailSender.SendEmailAsync(emp.Email, subject, htmlMessage);

            Console.WriteLine($" 寄信完成，回傳 200 OK");
            return Ok(new { message = "邀請信已成功發送！" });
        }
    }
}