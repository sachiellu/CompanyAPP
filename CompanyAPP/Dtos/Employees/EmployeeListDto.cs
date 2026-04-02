namespace CompanyAPP.Dtos
{
    public class EmployeeListDto
    {
        public int Id { get; set; }
        public string StaffId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Position { get; set; }
        public string Email { get; set; } = string.Empty;
        public int Status { get; set; }
        public string CompanyName { get; set; } = "未分配";
    }
}