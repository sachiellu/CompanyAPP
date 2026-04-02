namespace CompanyAPP.Dtos.Employees
{
    public class EmployeeUpdateDto
    {
        public int Id { get; set; } // 更新時需要
        public string? StaffId { get; set; }
        public string? Name { get; set; }
        public string? Position { get; set; }
        public string? Email { get; set; }
        public int CompanyId { get; set; }
    }
}