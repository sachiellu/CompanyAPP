using System; // 為了 DateTime
using System.Collections.Generic; // 為了 List
using System.ComponentModel.DataAnnotations; // 為了 [Required]
using CompanyAPP.Models; // 關鍵！為了讀取你 Models 資料夾裡的 ContactDto

namespace CompanyAPP.Dtos.Companies
{
    public class CompanyUpdateDto
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "名稱為必填")]
        public string Name { get; set; } = string.Empty;

        public string? TaxId { get; set; }
        public string? Industry { get; set; }
        public string? Address { get; set; }
        public DateTime? FoundedDate { get; set; }

        public string? LogoPath { get; set; } // 接收 React 傳來的 Cloudinary 網址
        public List<ContactDto> Contacts { get; set; } = new(); // 自動解析聯絡人清單
    }
}