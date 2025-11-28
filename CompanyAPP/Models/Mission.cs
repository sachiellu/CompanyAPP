using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CompanyAPP.Models
{
    public enum MissionStatus
    {
        Pending = 0, // 待處理
        Processing = 1, // 處理中
        Completed = 2 // 已完成
    }

    public class Mission
    {
        public int Id { get; set; }

        [Display(Name = "任務標題")]
        [Required]
        public string Title { get; set; } = string.Empty;

        [Display(Name = "任務內容")]
        public string? Description { get; set; }

        [Display(Name = "建立日期")]
        [DataType(DataType.Date)]
        public DateTime CreateDate { get; set; } = DateTime.Now;

        [Display(Name = "截止日期")]
        [DataType(DataType.Date)]
        public DateTime Deadline { get; set; }

        [Display(Name = "狀態")]
        public MissionStatus Status { get; set; } = MissionStatus.Pending;

        [Display(Name = "客戶廠商")]
        public int CompanyId { get; set; }

        [ForeignKey("CompanyId")]
        public virtual Company? Company { get; set; }

        [Display(Name = "負責員工")]
        public int EmployeeId { get; set; }

        [ForeignKey("EmployeeId")]
        public virtual Employee? Employee { get; set; }
    }
}