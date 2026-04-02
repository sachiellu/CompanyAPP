using CompanyAPP.Models;

namespace CompanyAPP.Services.Missions
{
    public interface IMissionService
    {
        Task<IEnumerable<Mission>> GetAllAsync();
        Task<Mission?> GetByIdAsync(int id);
        Task AddAsync(Mission mission);
        Task UpdateAsync(Mission mission);
        Task DeleteAsync(int id);
    }
}