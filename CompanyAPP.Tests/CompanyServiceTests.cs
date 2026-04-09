using Xunit;
using Moq;
using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using CompanyAPP.Services.Common;
using CompanyAPP.Services.Companies;

namespace CompanyAPP.Tests;

public class CompanyServiceTests
{

    private readonly Mock<AuditService> _mockAuditService;
    private readonly Mock<IImageService> _mockImageService;
    private readonly Mock<IHttpContextAccessor> _mockAccessor;

    public CompanyServiceTests()
    {
        // 2. 初始化 Mock 物件
        _mockImageService = new Mock<IImageService>();
        _mockAccessor = new Mock<IHttpContextAccessor>();

        // 給 AuditService 傳入 null, null 是因為 Moq 只負責模擬外殼
        // 但記得去 AuditService.cs 的 LogAsync 加上 virtual 關鍵字！
        _mockAuditService = new Mock<AuditService>(new Mock<CompanyAppContext>().Object, _mockAccessor.Object);
    }

    [Fact]
    public async Task GetCompaniesAsync_ShouldReturnFilteredResults_WhenKeywordIsProvided()
    {
        // 3. Arrange (安排資料)
        var options = new DbContextOptionsBuilder<CompanyAppContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // 使用 Guid 確保每次測試資料庫獨立
            .Options;

        using var context = new CompanyAppContext(options, _mockAccessor.Object);

        // 🚨 修正：現在實例化必須傳入 3 個參數
        var service = new CompanyService(context, _mockImageService.Object, _mockAuditService.Object);

        // 塞入測試資料
        context.Company.AddRange(new List<Company>
        {
            new Company { Id = 1, Name = "台灣積體電路", TaxId = "12345678" },
            new Company { Id = 2, Name = "美合華科技", TaxId = "87654321" }
        });
        await context.SaveChangesAsync();

        // 4. Act (執行搜尋)
        var result = await service.GetAllAsync("美合華");

        // 5. Assert (驗證)
        Assert.Single(result);
        Assert.Contains("美合華", result.First().Name);
    }
}