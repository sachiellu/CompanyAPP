using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Authorization; 

namespace CompanyAPP.Controllers
{
    [Authorize]
    public class CompaniesController : Controller
    {
        private readonly CompanyAppContext _context;
        private readonly IWebHostEnvironment _hostEnvironment;

        public CompaniesController(CompanyAppContext context, IWebHostEnvironment hostEnvironment)
        {
            _context = context;
            _hostEnvironment = hostEnvironment;
        }

        // GET: Companies
        public async Task<IActionResult> Index(string searchString)
        {
            var companies = from c in _context.Company
                            select c;

            if (!string.IsNullOrEmpty(searchString))
            {
                companies = companies.Where(s => s.Name.Contains(searchString));
                ViewData["CurrentFilter"] = searchString;
            }

            return View(await companies.ToListAsync());
        }

        // GET: Companies/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null) return NotFound();

            var company = await _context.Company
                .Include(c => c.Employees)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (company == null) return NotFound();

            return View(company);
        }

        // GET: Companies/Create
        public IActionResult Create()
        {

            var company = new Company
            {
                FoundedDate = DateTime.Now.AddYears(-5)
            };

            return View(company);
        }

        // POST: Companies/Create
        [HttpPost]
        [ValidateAntiForgeryToken]

        public async Task<IActionResult> Create(Company company)
        {
            // 為了教學方便，暫時忽略模型驗證，確保圖片能上傳
            // if (ModelState.IsValid) 
            {
                 // 圖片上傳邏輯
                if (company.ImageFile != null)
                {
                    string wwwRootPath = _hostEnvironment.WebRootPath;
                    string fileName = Guid.NewGuid().ToString() + System.IO.Path.GetExtension(company.ImageFile.FileName);
                    string path = System.IO.Path.Combine(wwwRootPath + "/images/", fileName);

                    using (var fileStream = new System.IO.FileStream(path, System.IO.FileMode.Create))
                    {
                        await company.ImageFile.CopyToAsync(fileStream);
                    }
                    company.LogoPath = fileName;
                }


                _context.Add(company);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(company);
        }

        // GET: Companies/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var company = await _context.Company.FindAsync(id);
            if (company == null) return NotFound();
            return View(company);
        }

        // POST: Companies/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]

        public async Task<IActionResult> Edit(int id, Company company)
        {
            if (id != company.Id) return NotFound();

            // if (ModelState.IsValid)
            {
                try
                {
                    // 圖片更新邏輯
                    if (company.ImageFile != null)
                    {
                        string wwwRootPath = _hostEnvironment.WebRootPath;
                        string fileName = Guid.NewGuid().ToString() + System.IO.Path.GetExtension(company.ImageFile.FileName);
                        string path = System.IO.Path.Combine(wwwRootPath + "/images/", fileName);

                        using (var fileStream = new System.IO.FileStream(path, System.IO.FileMode.Create))
                        {
                            await company.ImageFile.CopyToAsync(fileStream);
                        }
                        company.LogoPath = fileName; 
                    }

                    _context.Update(company);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!CompanyExists(company.Id)) return NotFound();
                    else throw;
                }
                return RedirectToAction(nameof(Index));
            }
            return View(company);
        }

        // GET: Companies/Delete/5
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null) return NotFound();

            var company = await _context.Company.FirstOrDefaultAsync(m => m.Id == id);
            if (company == null) return NotFound();

            return View(company);
        }

        // POST: Companies/Delete/5
        [Authorize(Roles = "Admin")]
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var company = await _context.Company.FindAsync(id);
            if (company != null)
            {
                _context.Company.Remove(company);
            }
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        private bool CompanyExists(int id)
        {
            return _context.Company.Any(e => e.Id == id);
        }
    }
}