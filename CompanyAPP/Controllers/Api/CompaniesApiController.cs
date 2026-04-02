using CompanyAPP.Data;
using CompanyAPP.Dtos.Companies; // 讀取廠商 DTO
using CompanyAPP.Models;
using CompanyAPP.Services.Common;
using CompanyAPP.Services.Companies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System; // 為了 DateTime
using System.Collections.Generic; // 為了 List
using System.Linq; // 為了 Select 轉型


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

        // 圖片即時上傳 Endpoint (對接 React 選圖後的 api.post)
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
        public async Task<IActionResult> UpdateCompany(int id, [FromBody] CompanyUpdateDto dto)
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

            // 將 DTO 的 ContactDto 轉回 Model 的 Contact，Service 才吃
            var contactModels = dto.Contacts.Select(c => new Contact
            {
                Id = c.Id,
                Name = c.Name,
                Phone = c.Phone,
                Email = c.Email,
                Remark = c.Remark,
                CompanyId = id
            }).ToList();

            await _companyService.UpdateAsync(companyToUpdate, contactModels);
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