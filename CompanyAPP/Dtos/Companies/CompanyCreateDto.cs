using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;  // 確保這行在，驗證才有效

namespace CompanyAPP.Dtos.Companies
{
    public class CompanyCreateDto
    {
        [FromForm(Name = "name")]
        public string Name { get; set; } = string.Empty;

        [FromForm(Name = "industry")]
        public string? Industry { get; set; }

        [FromForm(Name = "address")]
        public string? Address { get; set; }

        [FromForm(Name = "taxId")]
        [StringLength(8, MinimumLength = 8, ErrorMessage = "統一編號必須是 8 碼")]
        [RegularExpression(@"^[0-9]*$", ErrorMessage = "統一編號只能包含數字")]
        public string? TaxId { get; set; }

        [FromForm(Name = "foundedDate")]
        public DateTime? FoundedDate { get; set; }

        [FromForm(Name = "imageFile")]
        public IFormFile? ImageFile { get; set; }

        [FromForm(Name = "contactsJson")]
        public string? ContactsJson { get; set; }
    }
}