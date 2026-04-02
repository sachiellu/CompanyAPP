using CompanyAPP.Data;
using CompanyAPP.Dtos.Reports;
using CompanyAPP.Models;
using CompanyAPP.Services.Common;
using Microsoft.EntityFrameworkCore;

namespace CompanyAPP.Services.Employees
{
    public class EmployeeService : IEmployeeService
    {
        private readonly CompanyAppContext _context;
        private readonly AuditService _auditService; // 1. 注入 AuditService

        public EmployeeService(CompanyAppContext context, AuditService auditService)
        {
            _context = context;
            _auditService = auditService;

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
                    e.Company != null && e.Company.Name.Contains(searchString)
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

            await _auditService.LogAsync(
                entityName: "Employee",
                action: "Create",
                keyValues: $"StaffId: {employee.StaffId}",
                changes: $"建立了新員工: {employee.Name} (Email: {employee.Email})"
            );
        }

        public async Task UpdateAsync(Employee employee)
        {
            _context.Update(employee);
            await _context.SaveChangesAsync();

            // 2. 存檔成功後，立刻埋點
            await _auditService.LogAsync(
                entityName: "Employee",
                action: "Update",
                keyValues: $"StaffId: {employee.StaffId}",
                changes: $"管理者修改了員工 {employee.Name} 的資料 (ID: {employee.Id})"
            );
        }

        public async Task DeleteAsync(int id)
        {
            var emp = await _context.Employee.FindAsync(id);
            if (emp != null)
            {
                string empName = emp.Name;
                string staffId = emp.StaffId;

                _context.Employee.Remove(emp);
                await _context.SaveChangesAsync();

                await _auditService.LogAsync(
                    entityName: "Employee",
                    action: "Delete",
                    keyValues: $"StaffId: {staffId}",
                    changes: $"刪除了員工: {empName} (ID: {id})"
                );

            }
        }

        public async Task<int> DeleteBatchAsync(List<int> ids)
        {
            var items = await _context.Employee.Where(e => ids.Contains(e.Id)).ToListAsync();
            if (!items.Any()) return 0;

            _context.Employee.RemoveRange(items);
            var result = await _context.SaveChangesAsync();

            await _auditService.LogAsync(
                entityName: "Employee",
                action: "DeleteBatch",
                keyValues: $"Count: {items.Count}",
                changes: $"批次刪除了 {items.Count} 筆員工資料"
            );
            return result;
        }

    }
}