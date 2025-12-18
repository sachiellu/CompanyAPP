using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Authorization;
using CompanyAPP.Services;

namespace CompanyAPP.Controllers
{
    [Authorize]
    public class CompaniesController : Controller
    {
        private readonly ICompanyService _companyService;

        public CompaniesController(ICompanyService companyService)
        {
            _companyService = companyService;
        }

        [HttpGet]
        public async Task<IActionResult> Index(string searchString)
        {
            var companies = await _companyService.GetAllAsync(searchString);
            
            ViewData["CurrentFilter"] = searchString;
            return View(companies);
        }

        [HttpGet]
        public async Task<IActionResult> Details(int? id)
        {
            var company = await _companyService.GetByIdAsync(id);

            if (id == null) return NotFound();
            return View(company);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public IActionResult Create()
        {
            var company = new Company
            {
                FoundedDate = DateTime.Now.AddYears(-5)
            };
            return View(company);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(Company company)
        {
             if (ModelState.IsValid) 
             {
                await _companyService.AddAsync(company);

                TempData["SuccessMessage"] = "廠商已新增成功！";
                return RedirectToAction(nameof(Index));
             }
            return View(company);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Edit(int? id)
        {
            var company = await _companyService.GetByIdAsync(id);
            if (company == null) return NotFound();
            return View(company);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Edit(int id, Company company)
        {
            if (id != company.Id) return NotFound();
            try
            {
                // 呼叫 Service 更新
                await _companyService.UpdateAsync(company);
            }
            catch (Exception) // 簡化錯誤捕捉
            {
                if (!_companyService.CompanyExists(company.Id)) return NotFound();
                else throw;
            }

            TempData["SuccessMessage"] = "廠商已修改成功！";
            return RedirectToAction(nameof(Index));
        }

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            await _companyService.DeleteAsync(id);

            TempData["SuccessMessage"] = "廠商已成功刪除！";
            return RedirectToAction(nameof(Index));
        }
    }
}