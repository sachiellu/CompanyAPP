using CompanyAPP.Dtos.Reports;

namespace CompanyAPP.Dtos.Common
{
    public class ImportResult
    {
        public int SuccessCount { get; set; } = 0;

        public List<RowReport> Reports { get; set; } = new();
    }
}