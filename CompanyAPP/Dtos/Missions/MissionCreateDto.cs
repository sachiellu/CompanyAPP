using System.ComponentModel.DataAnnotations;

namespace CompanyAPP.Dtos.Missions
{
    public class MissionCreateDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public DateTime Deadline { get; set; }

        /// <summary>Pending | Processing | Completed（字串，與前端一致）</summary>
        public string Status { get; set; } = "Pending";

        public int CompanyId { get; set; }

        public int EmployeeId { get; set; }
    }
}
