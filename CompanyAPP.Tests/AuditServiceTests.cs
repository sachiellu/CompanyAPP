using Xunit;
using Moq;
using CompanyAPP.Services;
using CompanyAPP.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;



namespace CompanyAPP.Tests;

public class AuditServiceTests
{
    [Fact]
    public async Task LogAsync_ShouldAddLogToDatabase()
    {

        // 1. Arrange (安排)
        // 設定記憶體資料庫，這樣測試就不會真的改到 company.db
        var options = new DbContextOptionsBuilder<CompanyAppContext>()
            .UseInMemoryDatabase(databaseName: "AuditTestDb")
            .Options;

        // 模擬 HttpContextAccessor (因為 AuditService 構造函數需要它)
        var mockAccessor = new Mock<IHttpContextAccessor>();
        using var context = new CompanyAppContext(options, mockAccessor.Object);

        // 初始化 Service
        var service = new AuditService(context, mockAccessor.Object);

        // 2. Act (執行)
        // 呼叫你的非同步方法
        await service.LogAsync("Employee", "Delete", "ID: 99", "Test Change");

        // 3. Assert (驗證)
        // 檢查記憶體資料庫裡的 AuditLogs 是否真的增加了一筆紀錄
        var count = await context.AuditLogs.CountAsync();
        Assert.Equal(1, count);
    }
}