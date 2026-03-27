using CompanyAPP.Models;

namespace CompanyAPP.Services
{
    public interface IEmployeeService
    {
        Task<bool> IsStaffIdExistAsync(string staffId);

        Task<bool> IsEmailExistAsync(string email);

        Task<IEnumerable<Employee>> GetAllAsync(string? searchString);

        Task<Employee?> GetByIdAsync(int id);

        Task AddAsync(Employee employee);
        Task UpdateAsync(Employee employee);
        Task DeleteAsync(int id);

        Task<int> DeleteBatchAsync(List<int> ids);

        Task<string> GetNextStaffIdAsync();
    }
}