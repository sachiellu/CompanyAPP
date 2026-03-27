using Xunit;
using Moq;
using CompanyAPP.Services;
using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CompanyAPP.Tests;

public class CompanyServiceTests
{
    [Fact]
    public async Task GetCompaniesAsync_ShouldReturnFilteredResults_WhenKeywordIsProvided()
    {
        // 1. Arrange (安排資料)
        var options = new DbContextOptionsBuilder<CompanyAppContext>()
            .UseInMemoryDatabase(databaseName: "CompanySearchDb")
            .Options;

        // 模擬 HttpContextAccessor
        var mockAccessor = new Mock<IHttpContextAccessor>();
        using var context = new CompanyAppContext(options, mockAccessor.Object);

        var mockImageService = new Mock<IImageService>();

        // 先塞入幾筆測試資料
        context.Company.AddRange(new List<Company>
        {
            new Company { Id = 1, Name = "台灣積體電路", TaxId = "12345678" },
            new Company { Id = 2, Name = "美合華科技", TaxId = "87654321" }
        });

        await context.SaveChangesAsync();

        var service = new CompanyService(context, mockImageService.Object); // 假設你的 CompanyService 只需要 DbContext

        // 2. Act (執行搜尋)
        // 假設你的 GetCompaniesAsync 接受一個關鍵字參數
        var result = await service.GetAllAsync("美合華");

        // 3. Assert (驗證)
        // 預期應該只會找到 1 筆資料，且名稱包含「美合華」
        Assert.Single(result);
        Assert.Contains("美合華", result.First().Name);
    }
}