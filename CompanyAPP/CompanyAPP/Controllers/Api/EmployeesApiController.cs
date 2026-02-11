using CompanyAPP.Services;
using CompanyAPP.Models;
using CompanyAPP.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;

namespace CompanyAPP.Controllers.Api
{
    [Route("api/employees")]
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class EmployeesApiController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;
        private readonly CompanyAppContext _context;

        public EmployeesApiController(IEmployeeService employeeService, CompanyAppContext context)
        {
            _employeeService = employeeService;
            _context = context;
        }

        public class EmployeeDto
        {
            public string? Name { get; set; }
            public string? Position { get; set; }
            public string? Email { get; set; }
            public int CompanyId { get; set; }
            public string? StaffId { get; set; }
        }

        [HttpGet]
        public async Task<IActionResult> GetEmployees(string? searchString)
        {
            var emps = await _employeeService.GetAllAsync(searchString);
            return Ok(emps.Select(e => new
            {
                e.Id,
                e.StaffId,
                e.Name,
                e.Position,
                e.Email,
                e.Status,
                e.CompanyId,
                CompanyName = e.Company?.Name ?? "未分配"
            }));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEmployee(int id)
        {
            var emp = await _employeeService.GetByIdAsync(id);
            if (emp == null) return NotFound();
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
        public async Task<IActionResult> CreateEmployee([FromBody] EmployeeDto dto)
        {
            var emp = new Employee
            {
                Name = dto.Name ?? "",
                StaffId = dto.StaffId ?? "",
                Position = dto.Position,
                Email = dto.Email,
                CompanyId = dto.CompanyId,
                Status = Employee.EmployeeStatus.Unregistered
            };
            await _employeeService.AddAsync(emp);
            return Ok(new { message = "新增成功" });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(int id, [FromBody] EmployeeDto dto)
        {
            var emp = await _context.Employee.FindAsync(id);
            if (emp == null) return NotFound();

            emp.Name = dto.Name ?? emp.Name;
            emp.Position = dto.Position;
            emp.StaffId = dto.StaffId ?? emp.StaffId;
            emp.CompanyId = dto.CompanyId;

            if (emp.Status != Employee.EmployeeStatus.Active) emp.Email = dto.Email;

            await _employeeService.UpdateAsync(emp);
            return Ok(new { message = "修改成功" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            await _employeeService.DeleteAsync(id);
            return Ok(new { message = "刪除成功" });
        }

        [HttpPost("import")]
        public async Task<IActionResult> Import(IFormFile excelFile)
        {
            if (excelFile == null || excelFile.Length == 0) return BadRequest("無效檔案");
            using (var stream = excelFile.OpenReadStream())
            {
                var result = await _employeeService.ImportFromExcelAsync(stream);
                return Ok(new { successCount = result.SuccessCount, reports = result.Reports });
            }
        }

        [HttpPost("export")]
        public async Task<IActionResult> Export([FromBody] List<int>? ids)
        {
            var file = await _employeeService.ExportToExcelAsync(ids);
            return File(file, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Employees.xlsx");
        }
    }
}