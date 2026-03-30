using CompanyAPP.Data;
using CompanyAPP.Dtos;
using CompanyAPP.Models;
using CompanyAPP.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations; // 確保這行在，驗證才有效

namespace CompanyAPP.Controllers.Api
{
    [Route("api/companies")]
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class CompaniesApiController : ControllerBase
    {
        private readonly ICompanyService _companyService;
        private readonly IImageService _imageService; // 圖片服務變數
        private readonly CompanyAppContext _context;     // 資料庫上下文變數

        // 建構子：確保三個服務都正確注入並賦值
        public CompaniesApiController(
            ICompanyService companyService,
            IImageService imageService,
            CompanyAppContext context)
        {
            _companyService = companyService;
            _imageService = imageService; // 賦值給 private 變數
            _context = context;           // 賦值給 private 變數
        }

        // --- DTO 定義區 ---
        public class CompanyCreateDto
        {
            [FromForm(Name = "name")] public string Name { get; set; } = string.Empty;
            [FromForm(Name = "industry")] public string? Industry { get; set; }
            [FromForm(Name = "address")] public string? Address { get; set; }

            [FromForm(Name = "taxId")]
            [StringLength(8, MinimumLength = 8, ErrorMessage = "統一編號必須是 8 碼")]
            [RegularExpression(@"^[0-9]*$", ErrorMessage = "統一編號只能包含數字")]
            public string? TaxId { get; set; }

            [FromForm(Name = "foundedDate")] public DateTime? FoundedDate { get; set; }
            [FromForm(Name = "imageFile")] public IFormFile? ImageFile { get; set; }
            [FromForm(Name = "contactsJson")] public string? ContactsJson { get; set; }
        }

        // --- API 方法區 ---

        // 1. 新增：圖片即時上傳 Endpoint (對接 React 選圖後的 api.post)
        [HttpPost("upload-logo")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UploadLogo(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("檔案無效");
            try
            {
                var imageUrl = await _imageService.UploadImageAsync(file);
                return Ok(new { url = imageUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"圖片上傳失敗: {ex.Message}");
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetCompanies(string? searchString)
        {
            var companies = await _companyService.GetAllAsync(searchString ?? "");
            return Ok(companies.Select(c => new
            {
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
                Employees = company.Employees?.Select(e => new
                {
                    e.Id,
                    e.StaffId,
                    e.Name,
                    e.Position,
                    e.Status
                }) ?? Enumerable.Empty<object>(),
                Contacts = company.Contacts?.Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Phone,
                    c.Email,
                    c.Remark
                }) ?? Enumerable.Empty<object>()
            });
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateCompany([FromForm] CompanyCreateDto dto)
        {
            var company = new Company
            {
                Name = dto.Name ?? "未知",
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
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateCompany(int id, [FromBody] CompanyUpdateJsonDto dto)
        {
            if (id != dto.Id) return BadRequest("ID 不一致");

            var companyToUpdate = new Company
            {
                Id = id,
                Name = dto.Name,
                Industry = dto.Industry,
                Address = dto.Address,
                TaxId = dto.TaxId,
                FoundedDate = dto.FoundedDate,
                LogoPath = dto.LogoPath
            };

            await _companyService.UpdateAsync(companyToUpdate, dto.Contacts);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCompany(int id)
        {
            await _companyService.DeleteAsync(id);
            return NoContent();
        }

        [HttpPost("export")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Export([FromBody] List<int>? ids)
        {
            var file = await _companyService.ExportToExcelAsync(ids);
            return File(file, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Companies.xlsx");
        }
    }
}