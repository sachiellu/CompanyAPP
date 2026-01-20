using CompanyAPP.Services;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace CompanyAPP.Controllers.Api
{
    // 強制指定路由為 api/companies
    [Route("api/companies")]
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [IgnoreAntiforgeryToken]
    public class CompaniesApiController : ControllerBase
    {
        private readonly ICompanyService _companyService;

        public class CompanyCreateDto
        {
            public string Name { get; set; }
            public string Industry { get; set; }
            public string Address { get; set; }
            public string TaxId { get; set; }

            public DateTime? FoundedDate { get; set; }

            public IFormFile? ImageFile { get; set; }
        }

        public CompaniesApiController(ICompanyService companyService)
        {
            _companyService = companyService;
        }

        // GET: api/companies
        // 取得所有廠商資料 (回傳 JSON)
        [HttpGet]
 
        public async Task<ActionResult<IEnumerable<object>>> GetCompanies(string? searchString)

        {
            // 2. 把 searchString 傳給 Service
            var companies = await _companyService.GetAllAsync(searchString);

            var result = companies.Select(c => new
            {
                c.Id,
                c.Name,
                c.Industry,
                c.Address,
                c.TaxId,
                c.FoundedDate,
                c.LogoPath
            });

            return Ok(result);
        }

        // GET: api/companies
        // 取得單一廠商 (這就是詳情頁要打的 API)
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetCompany(int id)
        {
            var company = await _companyService.GetByIdAsync(id);

            if (company == null)
            {
                return NotFound();
            }

            // 使用 DTO 模式回傳，最安全，絕對不會有 500 Error
            return Ok(new
            {
                company.Id,
                company.Name,
                company.Industry,
                company.Address,
                company.TaxId,
                company.FoundedDate,
                company.LogoPath,

                Employees = company.Employees.Select(e => new { 
                    e.Id, 
                    e.Name, 
                    e.Position, 
                    e.Email
                }) ?? Enumerable.Empty<object>() // 如果沒員工就回傳空清單，避免前端 map 噴錯
            });
        }

        [HttpPost]
        public async Task<ActionResult<Company>> CreateCompany([FromForm] CompanyCreateDto dto)
        {
            // 手動轉成 Company 實體，並補上預設值
            var company = new Company
            {
                Name = dto.Name,
                Industry = dto.Industry,
                Address = dto.Address,
                TaxId = dto.TaxId,
                FoundedDate = dto.FoundedDate ?? DateTime.Now.AddYears(-5),  // 有日期就用傳的，沒傳就用現在時間

                LogoPath = "", // 補上空字串，避免 null 報錯
                               // Employees 不用管，預設是 null
                // 把檔案傳給 Service 處理               
                ImageFile = dto.ImageFile
            };

            await _companyService.AddAsync(company);

            // 回傳成功
            return CreatedAtAction(nameof(GetCompany), new { id = company.Id }, company);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCompany(int id, [FromForm] CompanyCreateDto dto)
        {
            var existingCompany = await _companyService.GetByIdAsync(id);
            if (existingCompany == null) return NotFound();

            // 更新欄位 (只更新前端傳來的，保留舊的 Logo 和 ID)
            existingCompany.Name = dto.Name;
            existingCompany.Industry = dto.Industry;
            existingCompany.Address = dto.Address;
            existingCompany.TaxId = dto.TaxId;

            if (dto.FoundedDate.HasValue)
            {
                existingCompany.FoundedDate = dto.FoundedDate.Value;
            }

            if (dto.ImageFile != null)
            {
                existingCompany.ImageFile = dto.ImageFile;
            }

            await _companyService.UpdateAsync(existingCompany);
            return NoContent();
        }

        [HttpDelete("{id}")]
  //    [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCompany(int id)
        {
            if (!_companyService.CompanyExists(id)) return NotFound();
            await _companyService.DeleteAsync(id);
            return NoContent();
        }
    }
}