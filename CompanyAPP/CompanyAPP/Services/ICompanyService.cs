using CompanyAPP.Models;

namespace CompanyAPP.Services
{
    public interface ICompanyService
    {
        Task<List<Company>> GetAllAsync(string searchString);

        Task<Company?> GetByIdAsync(int? id);

        Task AddAsync(Company company);

        Task UpdateAsync(Company company);

        Task DeleteAsync(int id);
        bool CompanyExists(int id);
    }
}