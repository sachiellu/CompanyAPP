namespace CompanyAPP.Dtos.Missions
{
    public class MissionUpdateDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? Deadline { get; set; }
        public int? CompanyId { get; set; }
        public int? EmployeeId { get; set; }
        public string Status { get; set; } = "Pending";
    }
}