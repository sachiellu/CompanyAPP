using CompanyAPP.Models;

namespace CompanyAPP.Services
{
    public interface ICompanyService
    {
        Task<List<Company>> GetAllAsync(string searchString);
        Task<Company?> GetByIdAsync(int? id);
        Task AddAsync(Company company);
        Task UpdateAsync(Company updatedCompany, List<ContactDto> contactDtos);
        Task DeleteAsync(int id);
        bool CompanyExists(int id);

        Task<byte[]> ExportToExcelAsync(List<int>? ids = null);
    }
}