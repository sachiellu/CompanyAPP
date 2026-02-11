using CompanyAPP.Services;
using CompanyAPP.Models;
using CompanyAPP.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;

namespace CompanyAPP.Controllers.Api
{
    [Route("api/companies")]
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class CompaniesApiController : ControllerBase
    {
        private readonly ICompanyService _companyService;
        private readonly CompanyAppContext _context;

        public CompaniesApiController(ICompanyService companyService, CompanyAppContext context)
        {
            _companyService = companyService;
            _context = context;
        }

        public class CompanyCreateDto
        {
            public string Name { get; set; } = string.Empty;
            public string? Industry { get; set; }
            public string? Address { get; set; }
            public string? TaxId { get; set; }
            public DateTime? FoundedDate { get; set; }
            public IFormFile? ImageFile { get; set; }

            // 關鍵修正：加入聯絡人清單，這樣 [FromForm] 才能抓到 Contacts[0].Name 這種資料
            public List<ContactDto>? Contacts { get; set; }
        }

        [HttpGet]
        public async Task<IActionResult> GetCompanies(string? searchString)
        {
            var companies = await _companyService.GetAllAsync(searchString ?? "");
            return Ok(companies.Select(c => new {
                c.Id,
                c.Name,
                c.Industry,
                c.Address,
                c.TaxId,
                c.LogoPath
            }));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCompany(int id)
        {
            var company = await _companyService.GetByIdAsync(id);
            if (company == null) return NotFound();

            return Ok(new
            {
                company.Id,
                company.Name,
                company.Industry,
                company.Address,
                company.TaxId,
                company.FoundedDate,
                company.LogoPath,
                Employees = company.Employees?.Select(e => new {
                    e.Id,
                    e.StaffId,
                    e.Name,
                    e.Position,
                    e.Status
                }) ?? Enumerable.Empty<object>(),
                Contacts = company.Contacts?.Select(c => new {
                    c.Id,
                    c.Name,
                    c.Phone,
                    c.Email,
                    c.Remark
                }) ?? Enumerable.Empty<object>()
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateCompany([FromForm] CompanyCreateDto dto)
        {
            var company = new Company
            {
                Name = dto.Name,
                Industry = dto.Industry,
                Address = dto.Address,
                TaxId = dto.TaxId,
                FoundedDate = dto.FoundedDate ?? DateTime.Now.AddYears(-5),
                LogoPath = "",
                ImageFile = dto.ImageFile
            };
            await _companyService.AddAsync(company);
            return Ok(new { id = company.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCompany(int id, [FromForm] CompanyCreateDto dto)
        {
            var existing = await _context.Company.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Name = dto.Name;
            existing.Industry = dto.Industry;
            existing.Address = dto.Address;
            existing.TaxId = dto.TaxId;
            if (dto.FoundedDate.HasValue) existing.FoundedDate = dto.FoundedDate.Value;
            if (dto.ImageFile != null) existing.ImageFile = dto.ImageFile;

            await _companyService.UpdateAsync(existing, dto.Contacts ?? new List<ContactDto>());
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompany(int id)
        {
            await _companyService.DeleteAsync(id);
            return NoContent();
        }

        [HttpPost("export")]
        public async Task<IActionResult> Export([FromBody] List<int>? ids)
        {
            var file = await _companyService.ExportToExcelAsync(ids);
            return File(file, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Companies.xlsx");
        }
    }
}