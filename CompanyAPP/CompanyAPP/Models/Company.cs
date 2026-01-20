using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CompanyAPP.Models
{
    public class Company
    {
        public virtual List<Employee>? Employees { get; set; }

        public int Id { get; set; }

        [Display(Name = "廠商名稱")]
        [Required(ErrorMessage = "請輸入廠商名稱")]
        public string Name { get; set; } = string.Empty;

        [Display(Name = "統一編號")]
        public string? TaxId { get; set; }

        [Display(Name = "產業類別")]
        public string? Industry { get; set; }

        [Display(Name = "地址")]
        public string? Address { get; set; }

        [Display(Name = "成立日期")]
        [DataType(DataType.Date)]
        public DateTime FoundedDate { get; set; }

        [Display(Name = "廠商 Logo")]
        public string? LogoPath { get; set; } // 存資料庫 (存檔名)

        [NotMapped] // 重要！告訴 EF Core 這個不要建到資料庫裡
        [Display(Name = "上傳圖片")]
        public IFormFile? ImageFile { get; set; } // 接收檔案
    }
}