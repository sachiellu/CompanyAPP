using ClosedXML.Excel;
using CompanyAPP.Controllers;
using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Security.Claims;
using Xunit;
using Microsoft.AspNetCore.Mvc.ViewFeatures;

namespace CompanyAPP.Tests
{
    public class EmployeesControllerTests
    {
        private (CompanyAppContext context, Mock<IHttpContextAccessor> mockAccessor) GetContext()
        {
            var options = new DbContextOptionsBuilder<CompanyAppContext>()
                            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                            .Options;
            // 這裡最重要：模擬登入狀態，否則你的 SaveChangesAsync 會報錯
            var mockAccessor = new Mock<IHttpContextAccessor>();
            var context = new DefaultHttpContext();
            var claims = new[] {
                new Claim(ClaimTypes.Name, "TestUser"),
                new Claim(ClaimTypes.NameIdentifier, "TestUserId")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            context.User = new ClaimsPrincipal(identity);
            mockAccessor.Setup(_ => _.HttpContext).Returns(context);

            return (new CompanyAppContext(options, mockAccessor.Object), mockAccessor);
        }

        [Fact]
        public async Task Import_ValidExcel_AddsEmployeesToDatabase()
        {
            // --- 1. Arrange (準備) ---
            var (context, _) = GetContext();

            // 建立測試公司
            var testCompany = new Company { Name = "測試公司" };
            context.Company.Add(testCompany);
            await context.SaveChangesAsync();

            var controller = new EmployeesController(context);

            // 關鍵修正：手動初始化 TempData
            // 因為在單元測試中，Controller 不會自動獲得 TempData，必須我們自己裝上去
            var httpContext = new DefaultHttpContext();
            var tempData = new TempDataDictionary(httpContext, Mock.Of<ITempDataProvider>());
            controller.TempData = tempData;

            // 建立 Excel 內容
            byte[] fileContents;
            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Employees");
                worksheet.Cell(1, 1).Value = "姓名";
                worksheet.Cell(1, 2).Value = "職位";
                worksheet.Cell(1, 3).Value = "Email";
                worksheet.Cell(1, 4).Value = "公司名稱";

                worksheet.Cell(2, 1).Value = "測試員A";
                worksheet.Cell(2, 2).Value = "工程師";
                worksheet.Cell(2, 3).Value = "testA@example.com";
                worksheet.Cell(2, 4).Value = "測試公司";

                using (var ms = new MemoryStream())
                {
                    workbook.SaveAs(ms);
                    fileContents = ms.ToArray();
                }
            }

            // 設定 Mock 檔案 (使用 Callback 模擬 CopyToAsync)
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
                    .Callback<Stream, CancellationToken>((stream, token) =>
                    {
                        stream.Write(fileContents, 0, fileContents.Length);
                    })
                    .Returns(Task.CompletedTask);

            fileMock.Setup(f => f.Length).Returns(fileContents.Length);
            fileMock.Setup(f => f.FileName).Returns("test.xlsx");

            // --- 2. Act (執行) ---
            var result = await controller.Import(fileMock.Object);

            // --- 3. Assert (驗證) ---
            Assert.IsType<RedirectToActionResult>(result); // 應該跳轉回 Index
            Assert.Equal(1, context.Employee.Count());     // 資料庫應該有 1 筆員工
            Assert.Equal("測試員A", context.Employee.First().Name); // 驗證名字對不對
        }


        [Fact]
        public async Task Import_EmptyFile_ReturnsViewWithError()
        {
            // --- 1. Arrange ---
            var (context, _) = GetContext();
            var controller = new EmployeesController(context);

            // 模擬空檔案
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(_ => _.Length).Returns(0);

            // --- 2. Act ---
            var result = await controller.Import(fileMock.Object);

            // --- 3. Assert ---
            Assert.IsType<ViewResult>(result);
            Assert.Equal(0, context.Employee.Count());
        }
    }
}