using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging; // 加入 Logger
using System.Net;
using System.Net.Mail;

namespace CompanyAPP.Services
{
    public class EmailSender : IEmailSender
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailSender> _logger; 

        public EmailSender(IConfiguration configuration, ILogger<EmailSender> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string email, string subject, string htmlMessage)
        {
            try
            {
                // 1. 從 appsettings (或 Fly Secrets) 讀取資料
                // 使用 ?. 運算子防止 null 崩潰，並提供預設值
                string host = _configuration["EmailSettings:Host"] ?? "smtp.gmail.com";
                int port = int.Parse(_configuration["EmailSettings:Port"] ?? "587");
                string myEmail = _configuration["EmailSettings:SenderEmail"] ?? string.Empty;
                string myPassword = _configuration["EmailSettings:AppPassword"] ?? string.Empty;

                // 2. 檢查關鍵資料是否為空
                if (string.IsNullOrEmpty(myEmail) || string.IsNullOrEmpty(myPassword))
                {
                    throw new Exception("Email 設定讀取失敗：SenderEmail 或 AppPassword 為空。請檢查 Fly Secrets。");
                }

                // 3. 設定 SMTP
                using (var client = new SmtpClient(host, port))
                {
                    client.EnableSsl = true;
                    client.UseDefaultCredentials = false;
                    client.Credentials = new NetworkCredential(myEmail, myPassword);

                    // 4. 建立信件
                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress(myEmail, "企業資源系統管理員"),
                        Subject = subject,
                        Body = htmlMessage,
                        IsBodyHtml = true
                    };
                    mailMessage.To.Add(email);

                    // 5. 發送
                    await client.SendMailAsync(mailMessage);
                    _logger.LogInformation($"成功發送郵件給：{email}");
                }
            }
            catch (Exception ex)
            {
                // 捕捉錯誤，不要讓網站掛掉 (500 Error)
                // 這樣可以在 fly logs 看到紅字，不會看到網頁壞掉
                _logger.LogError(ex, $"寄信失敗！目標：{email}, 錯誤訊息：{ex.Message}");
                // 這裡可以選擇是否要 throw，如果不 throw，程式會繼續執行 (註冊流程會跑完，只是沒收到信)
            }
        }
    }
}