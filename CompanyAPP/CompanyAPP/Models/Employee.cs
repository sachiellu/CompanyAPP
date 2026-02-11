using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CompanyAPP.Models
{
    public class Employee
    {
        // --- 1. 定義型別與列舉 (放在最上面，像說明書一樣) ---
        public enum EmployeeStatus
        {
            Unregistered = 0, // 待註冊
            Active = 1,       // 已啟動
            Disabled = 2      // 已停用
        }

        // --- 2. 主鍵 ID ---
        [Key]
        public int Id { get; set; }

        // --- 3. 業務資訊 (工號、姓名、職位) ---
        [Display(Name = "員工編號")]
        public string StaffId { get; set; } = string.Empty;

        [Display(Name = "員工姓名")]
        [Required(ErrorMessage = "請輸入員工姓名")]
        public string Name { get; set; } = string.Empty;

        [Display(Name = "職位")]
        public string? Position { get; set; }

        // --- 4. 帳號與通訊資訊 ---
        [Display(Name = "電子信箱")]
        [EmailAddress(ErrorMessage = "格式不正確")]
        public string? Email { get; set; }

        [Display(Name = "帳號狀態")]
        public EmployeeStatus Status { get; set; } = EmployeeStatus.Unregistered;

        [Display(Name = "關聯帳號ID")]
        public string? UserId { get; set; }

        // --- 5. 外部關聯與導覽屬性 (這部分通常放最後) ---
        [Display(Name = "所屬廠商")]
        public int CompanyId { get; set; }

        [ForeignKey("CompanyId")]
        public virtual Company? Company { get; set; }

        // 任務關聯
        public virtual ICollection<Mission>? Missions { get; set; }
    }
}