using CompanyAPP.Dtos.Common;

namespace CompanyAPP.Services.Employees
{
    public interface IEmployeeExcelService
    {
        Task<byte[]> ExportToExcelAsync(List<int>? ids);

        Task<ImportResult> ImportFromExcelAsync(Stream fileStream);
    }
}