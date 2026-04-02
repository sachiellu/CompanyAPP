using Microsoft.AspNetCore.Identity.UI.Services;
using System.Text;
using System.Text.Json;

namespace CompanyAPP.Services.Common
{
    public class EmailSender : IEmailSender
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailSender> _logger;
        private readonly HttpClient _httpClient;

        public EmailSender(IConfiguration configuration, ILogger<EmailSender> logger)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClient = new HttpClient();
        }

        public async Task SendEmailAsync(string email, string subject, string htmlMessage)
        {
            // 使用結構化讀取，對應 BrevoSettings:ApiKey
            var apiKey = _configuration["BrevoSettings:ApiKey"];
            var senderEmail = _configuration["BrevoSettings:SenderEmail"];

            if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(senderEmail))
            {
                _logger.LogError("EmailSender failed: BrevoSettings:ApiKey or SenderEmail is missing in configuration.");
                return;
            }

            var mailData = new
            {
                sender = new { name = "Company ERP System", email = senderEmail },
                to = new[] { new { email } },
                subject,
                htmlContent = htmlMessage
            };

            var json = JsonSerializer.Serialize(mailData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("api-key", apiKey);

            try
            {
                _logger.LogInformation("Attempting to send email via Brevo API to: {Email}", email);

                var response = await _httpClient.PostAsync("https://api.brevo.com/v3/smtp/email", content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email successfully delivered to Brevo API queue for: {Email}", email);
                }
                else
                {
                    var errorDetails = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Brevo API returned non-success status: {StatusCode}, Details: {Details}",
                        response.StatusCode, errorDetails);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred while calling Brevo API for: {Email}", email);
            }
        }
    }
}