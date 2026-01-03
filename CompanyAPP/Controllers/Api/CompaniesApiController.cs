using CompanyAPP.Services;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Mvc;

namespace CompanyAPP.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class CompaniesApiController : ControllerBase
    {
        private readonly ICompanyService _companyService;

        public CompaniesApiController(ICompanyService companyService)
        {
            _companyService = companyService;
        }
        // GET: api/CompaniesApi
        // 取得所有廠商資料 (JSON 格式)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Company>>> GetCompanies()
        {
            // 這裡直接呼叫你原本寫好的 Service，不用重寫邏輯，這就是架構好的好處！
            var companies = await _companyService.GetAllAsync("");
            return Ok(companies);
        }

        // GET: api/CompaniesApi/5
        // 取得單一廠商
        [HttpGet("{id}")]
        public async Task<ActionResult<Company>> GetCompany(int id)
        {
            var company = await _companyService.GetByIdAsync(id);

            if (company == null)
            {
                return NotFound();
            }

            return Ok(company);
        }
    }
}