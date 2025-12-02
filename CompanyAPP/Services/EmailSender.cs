using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;

namespace CompanyAPP.Services
{
    public class EmailSender : IEmailSender
    {
        private readonly IConfiguration _configuration;

        // 透過建構子注入設定檔 (IConfiguration)
        public EmailSender(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public Task SendEmailAsync(string email, string subject, string htmlMessage)
        {
            // 從 appsettings.json 讀取資料
            string myEmail = _configuration["EmailSettings:SenderEmail"];
            string myPassword = _configuration["EmailSettings:AppPassword"];

            // 設定 Google SMTP 伺服器
            var client = new SmtpClient("smtp.gmail.com", 587)
            {
                EnableSsl = true,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(myEmail, myPassword)
            };

            // 建立信件內容
            var mailMessage = new MailMessage
            {
                From = new MailAddress(myEmail, "企業資源系統管理員"),
                Subject = subject,
                Body = htmlMessage,
                IsBodyHtml = true
            };
            mailMessage.To.Add(email);

            // 發送郵件 (這裡用 Task.Run 包起來讓它非同步)
            return client.SendMailAsync(mailMessage);
        }
    }
}