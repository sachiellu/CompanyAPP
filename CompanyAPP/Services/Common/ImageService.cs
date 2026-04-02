using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;

namespace CompanyAPP.Services.Common
{
    public class ImageService : IImageService
    {
        private readonly Cloudinary _cloudinary;

        public ImageService(IConfiguration config)
        {
            var account = new Account(
                config["Cloudinary:CloudName"],
                config["Cloudinary:ApiKey"],
                config["Cloudinary:ApiSecret"]
            );
            _cloudinary = new Cloudinary(account);
        }

        public async Task<string> UploadImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0) return string.Empty;

            using var stream = file.OpenReadStream();
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = "company_app_vendors" // 設定雲端資料夾名稱
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            // 防呆檢查 
            if (uploadResult.Error != null)
            {
                // 上傳失敗時，印出錯誤訊息，並回傳空字串，不要讓程式崩潰
                Console.WriteLine($"Cloudinary 上傳失敗: {uploadResult.Error.Message}");
                return string.Empty;
            }

            // 確保 SecureUrl 不是 null 才呼叫 ToString
            return uploadResult.SecureUrl?.ToString() ?? string.Empty;
        }

        public async Task DeleteImageAsync(string publicId)
        {
            // 暫時先留空，之後可實作刪除邏輯
            await Task.CompletedTask;
        }
    }
}