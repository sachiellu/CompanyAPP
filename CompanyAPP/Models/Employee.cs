using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CompanyAPP.Models
{
    public class Employee
    {
        public virtual ICollection<Mission>? Missions { get; set; }

        public int Id { get; set; }

        [Display(Name = "員工姓名")]
        [Required(ErrorMessage = "請輸入員工姓名")]
        public string Name { get; set; } = string.Empty;

        [Display(Name = "職位")]
        public string? Position { get; set; }

        [Display(Name = "電子信箱")]
        [EmailAddress(ErrorMessage = "格式不正確")]
        public string? Email { get; set; }

        // --- 關聯 ---
        [Display(Name = "所屬廠商")]
        public int CompanyId { get; set; }

        [ForeignKey("CompanyId")]
        public virtual Company? Company { get; set; }
    }
}