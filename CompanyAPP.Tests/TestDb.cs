using CompanyAPP.Data;
using CompanyAPP.Services.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace CompanyAPP.Tests;

internal static class TestDb
{
    public static CompanyAppContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CompanyAppContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new CompanyAppContext(options, new Mock<IHttpContextAccessor>().Object);
    }

    public static Mock<AuditService> CreateAuditMock()
        => new(null!, null!);
}
