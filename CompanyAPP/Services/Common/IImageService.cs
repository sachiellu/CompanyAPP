using Microsoft.AspNetCore.Http;

namespace CompanyAPP.Services.Common
{
    public interface IImageService
    {
        Task<string> UploadImageAsync(IFormFile file);
        Task DeleteImageAsync(string publicId); // 如果需要刪除功能
    }
}