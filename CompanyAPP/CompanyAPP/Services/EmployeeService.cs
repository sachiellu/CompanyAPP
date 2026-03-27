using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.EntityFrameworkCore;

namespace CompanyAPP.Services
{
    public class EmployeeService : IEmployeeService
    {
        private readonly CompanyAppContext _context;

        public EmployeeService(CompanyAppContext context)
        {
            _context = context;
        }

        // === 1. 驗證/檢查類 (Validation) ===

        public async Task<bool> IsStaffIdExistAsync(string staffId)
        {
            return await _context.Employee.AnyAsync(e => e.StaffId == staffId);
        }

        public async Task<bool> IsEmailExistAsync(string email)
        {
            return await _context.Employee.AnyAsync(e => e.Email == email);
        }

        public async Task<string> GetNextStaffIdAsync()
        {
            // 邏輯：抓出資料庫中 ID 最大的那一筆，基於 ID 產生編號，保證不補空位且持續疊加
            var lastEmp = await _context.Employee.OrderByDescending(e => e.Id).FirstOrDefaultAsync();
            int nextId = (lastEmp?.Id ?? 0) + 1;
            return $"EMP{nextId:D4}"; // 會產生 EMP0001, EMP0002...
        }

        // === 2. 查詢類 (Read) ===

        public async Task<IEnumerable<Employee>> GetAllAsync(string? searchString)
        {
            var query = _context.Employee.Include(e => e.Company).AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchString))
            {
                searchString = searchString.Trim();
                query = query.Where(e =>
                    (e.Name ?? "").Contains(searchString) ||
                    (e.StaffId ?? "").Contains(searchString) ||
                    (e.Position ?? "").Contains(searchString) ||
                    (e.Email ?? "").Contains(searchString) ||
                    (e.Company != null && e.Company.Name.Contains(searchString))
                );
            }

            return await query.OrderBy(e => e.StaffId).ToListAsync();
        }

        public async Task<Employee?> GetByIdAsync(int id)
        {
            return await _context.Employee
                .Include(e => e.Company)
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        // === 3. 動作類 (Write / Action) ===

        public async Task AddAsync(Employee employee)
        {
            _context.Add(employee);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Employee employee)
        {
            _context.Update(employee);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var emp = await _context.Employee.FindAsync(id);

            if (emp != null)
            {
                _context.Employee.Remove(emp);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<int> DeleteBatchAsync(List<int> ids)
        {
            var items = await _context.Employee
                .Where(e => ids.Contains(e.Id))
                .ToListAsync();

            if (!items.Any()) return 0;

            _context.Employee.RemoveRange(items);

            return await _context.SaveChangesAsync();
        }

    }
}