using System.ComponentModel.DataAnnotations;
using CompanyAPP.Models; // 確保能讀到 ContactDto 或相關型別

namespace CompanyAPP.Dtos
{
    public class CompanyUpdateJsonDto
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