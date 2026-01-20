using CompanyAPP.Services;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;

//	定義檔案的邏輯位置 (門牌)
namespace CompanyAPP.Controllers.Api
{
	// 設定路由與守衛 (Attributes & Namespace)
	[Route("api/employees")]
	[ApiController] 
	[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
	// 公開的控制器繼承，繼承API的基礎功能(MVC架構是繼承Controller、API 是繼承ControllerBase)(ControllerBase為純資料傳遞，較輕盈)
	public class EmployeesApiController : ControllerBase
	{
		// 依賴注入 (Constructor & Dependency Injection)
		private readonly IEmployeeService _employeeService; // 假設你有這個
		private readonly ICompanyService _companyService;   // 用來檢查廠商是否存在

		public EmployeesApiController(IEmployeeService employeeService, ICompanyService companyService)
		{
			_employeeService = employeeService;
			_companyService = companyService;
		}

		// 資料傳輸物件 (DTO - Data Transfer Object)
		// DTO: 接收前端傳來的資料
		public class EmployeeDto
		{
			public string Name { get; set; }
			public string Position { get; set; }
			public string Email { get; set; }
            public int CompanyId { get; set; }  // 這是下拉選單選到的 ID
        }

        // 1. 取得員工列表 (GET: api/employees?searchString=xxx)
        [HttpGet]
        public async Task<IActionResult> GetEmployees(string? searchString)
        {
            var employees = await _employeeService.GetAllAsync(searchString);

            // 轉換成匿名物件回傳，包含廠商名稱
            var result = employees.Select(e => new
            {
                e.Id,
                e.Name,
                e.Position,
                e.Email,
                CompanyName = e.Company != null ? e.Company.Name : "未分配"
            });

            return Ok(result);
        }

        // 2. 取得單一員工 (GET: api/employees/5)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetEmployee(int id)
        {
            var emp = await _employeeService.GetByIdAsync(id);
            if (emp == null) return NotFound();

            return Ok(new
            {
                emp.Id,
                emp.Name,
                emp.Position,
                emp.Email,
                emp.CompanyId,
                // 用於詳情頁顯示廠商名稱
                CompanyName = emp.Company?.Name ?? "未分配"
            });
        }

        // 3. 新增員工 (POST: api/employees)
        [HttpPost]
        public async Task<IActionResult> CreateEmployee([FromBody] EmployeeDto dto)
        {
            var emp = new Employee
            {
                Name = dto.Name,
                Position = dto.Position,
                Email = dto.Email,
                CompanyId = dto.CompanyId
            };

            await _employeeService.AddAsync(emp);
            return Ok(new { message = "新增成功" });
        }

        // 4. 修改員工 (PUT: api/employees/5)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(int id, [FromBody] EmployeeDto dto)
        {
            var emp = await _employeeService.GetByIdAsync(id);
            if (emp == null) return NotFound();

            emp.Name = dto.Name;
            emp.Position = dto.Position;
            emp.Email = dto.Email;
            emp.CompanyId = dto.CompanyId;

            await _employeeService.UpdateAsync(emp);
            return Ok(new { message = "修改成功" });
        }

        // 5. 刪除員工 (DELETE: api/employees/5)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            await _employeeService.DeleteAsync(id);
            return Ok(new { message = "刪除成功" });
        }



        // 6. 匯入 Excel (POST: api/employees/Import)
        [HttpPost("import")]
        public async Task<IActionResult> Import(IFormFile excelFile)
        {
            if (excelFile == null || excelFile.Length == 0)
            {
                return BadRequest(new { message = "請選擇一個檔案" });
            }

            // 將上傳的檔案轉為串流 (Stream)
            using (var stream = excelFile.OpenReadStream())
            {
                // 呼叫 Service 處理
                var result = await _employeeService.ImportFromExcelAsync(stream);

                // 回傳結果給前端
                if (result.SuccessCount > 0)
                {
                    return Ok(new
                    {
                        message = $"匯入成功 {result.SuccessCount} 筆",
                        errors = result.ErrorMessages // 把錯誤訊息也傳回去，前端可以選擇要不要顯示
                    });
                }
                else
                {
                    return BadRequest(new
                    {
                        message = "匯入失敗，沒有資料被新增",
                        errors = result.ErrorMessages
                    });
                }
            }
        }

        // 6. 匯出 Excel (POST: api/employees/export)
        [HttpPost("export")]
        public async Task<IActionResult> Export([FromBody] List<int>? ids) // 接收選取的 ID 列表
        {
            // 呼叫 Service 產生 Excel (如果有傳 ID 就只匯出那些，沒傳就匯出全部)
            var fileContent = await _employeeService.ExportToExcelAsync(ids);

            return File(
                fileContent,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Employees.xlsx"
            );
        }


        // 7. 批次刪除 (POST: api/employees/delete-batch)
        [HttpPost("delete-batch")]
        public async Task<IActionResult> DeleteBatch([FromBody] List<int> ids)
        {
            int count = await _employeeService.DeleteBatchAsync(ids);
            return Ok(new { message = $"成功刪除 {count} 筆資料" });
        }
    }
}