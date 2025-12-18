using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.EntityFrameworkCore;

namespace CompanyAPP.Services
{
    public class CompanyService : ICompanyService
    {
        private readonly CompanyAppContext _context;
        private readonly IImageService _imageService;

        public CompanyService(CompanyAppContext context, IImageService imageService)
        {
            _context = context;
            _imageService = imageService;
        }

        public async Task<List<Company>> GetAllAsync(string searchString)
        {
            var companies = from c in _context.Company
                            select c;

            if (!string.IsNullOrEmpty(searchString))
            {
                companies = companies.Where(s => s.Name.Contains(searchString));
            }
            return await companies.ToListAsync();
        }

        public async Task<Company?> GetByIdAsync(int? id)
        {
            if (id == null) return null;
            return await _context.Company
                .Include(c => c.Employees)
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task AddAsync(Company company)
        {
            // 1. 處理圖片上傳 (使用 Cloudinary)
            if (company.ImageFile != null)
            {
                // 這裡呼叫我們寫好的 ImageService，拿到雲端網址
                company.LogoPath = await _imageService.UploadImageAsync(company.ImageFile);
            }
            else
            {
                // 如果沒傳圖，給一個預設圖片路徑 (選填)
                company.LogoPath = "default_company_logo.png";
            }

            // 2. 存入資料庫
            _context.Add(company);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Company company)
        {
            // 1. 處理圖片更新
            if (company.ImageFile != null)
            {
                // 上傳新圖，換掉舊的網址
                company.LogoPath = await _imageService.UploadImageAsync(company.ImageFile);
            }
            // 注意：如果使用者沒上傳新圖，LogoPath 會保持原本的樣子 (因為前端 hidden 欄位通常會帶回來，或者需要先從 DB 查出來)
            // 為了保險起見，比較嚴謹的做法是先查舊資料，這裡暫時簡化邏輯

            _context.Update(company);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var company = await _context.Company.FindAsync(id);
            if (company != null)
            {
                _context.Company.Remove(company);
                await _context.SaveChangesAsync();
            }
        }

        public bool CompanyExists(int id)
        {
            return _context.Company.Any(e => e.Id == id);
        }
    }
}