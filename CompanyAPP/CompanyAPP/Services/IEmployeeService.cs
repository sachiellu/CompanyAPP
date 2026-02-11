using CompanyAPP.Models;
using CompanyAPP.Services;

namespace CompanyAPP.Services
{
	public interface IEmployeeService
	{
		// 基本 CRUD
		Task<IEnumerable<Employee>> GetAllAsync(string? searchString);
		Task<Employee?> GetByIdAsync(int id);
		Task AddAsync(Employee employee);
		Task UpdateAsync(Employee employee);
		Task DeleteAsync(int id);

		//  補上進階功能
		Task<int> DeleteBatchAsync(List<int> ids);
		Task<byte[]> ExportToExcelAsync(List<int>? ids = null);
        Task<ImportResult> ImportFromExcelAsync(Stream fileStream);

    }
}