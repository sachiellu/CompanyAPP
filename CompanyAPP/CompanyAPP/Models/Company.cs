using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Http; 

namespace CompanyAPP.Models
{
    public class Company
    {
        public int Id { get; set; }

        [Display(Name = "公司/廠商名稱")]
        [Required(ErrorMessage = "請輸入公司/廠商名稱")]
        public string Name { get; set; } = string.Empty;

        [Display(Name = "公司類別")]
        public CompanyCategory Category { get; set; } = CompanyCategory.Client;

        public enum CompanyCategory
        {
            Client = 0,         // 客戶
            Supplier = 1,       // 供應商
            Subcontractor = 2   // 下包商
        }

        [Display(Name = "統一編號")]
        public string? TaxId { get; set; }

        [Display(Name = "產業類別")]
        public string? Industry { get; set; }

        [Display(Name = "地址")]
        public string? Address { get; set; }

        [Display(Name = "成立日期")]
        [DataType(DataType.Date)]
        public DateTime FoundedDate { get; set; } = DateTime.Now.AddYears(-5);

        // --- 關聯屬性 ---

        // 巢狀聯絡人清單
        public virtual ICollection<Contact> Contacts { get; set; } = new List<Contact>();
            
        // 員工清單（只保留這一個，建議使用 ICollection 比較標準）
        public virtual ICollection<Employee>? Employees { get; set; } = new List<Employee>();

        // --- 檔案處理 ---

        [Display(Name = "廠商 Logo")]
        public string? LogoPath { get; set; } // 存資料庫 (檔名)

        [NotMapped]
        [Display(Name = "上傳圖片")]
        public IFormFile? ImageFile { get; set; } // 接收檔案用，不進資料庫
    }
}