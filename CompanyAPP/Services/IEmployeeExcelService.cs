using CompanyAPP.Dtos;

namespace CompanyAPP.Services
{
    public interface IEmployeeExcelService
    {
        Task<byte[]> ExportToExcelAsync(List<int>? ids);

        Task<ImportResult> ImportFromExcelAsync(Stream fileStream);
    }
}