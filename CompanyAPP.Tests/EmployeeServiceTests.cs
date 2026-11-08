using CompanyAPP.Models;
using CompanyAPP.Services.Employees;

namespace CompanyAPP.Tests;

public class EmployeeServiceTests
{
    [Fact]
    public async Task GetAllAsync_ShouldFilterByName()
    {
        using var context = TestDb.CreateContext();
        var company = new Company { Name = "示範廠商" };
        context.Company.Add(company);
        await context.SaveChangesAsync();
        context.Employee.AddRange(
            new Employee { Name = "王小明", StaffId = "EMP0001", Email = "ming@example.com", CompanyId = company.Id },
            new Employee { Name = "陳大同", StaffId = "EMP0002", Email = "da@example.com", CompanyId = company.Id }
        );
        await context.SaveChangesAsync();

        var service = new EmployeeService(context, TestDb.CreateAuditMock().Object);

        var result = (await service.GetAllAsync("王小明")).ToList();

        var emp = Assert.Single(result);
        Assert.Equal("EMP0001", emp.StaffId);
    }

    [Fact]
    public async Task GetAllAsync_ShouldFilterByCompanyName()
    {
        using var context = TestDb.CreateContext();
        var acme = new Company { Name = "美合華科技" };
        var other = new Company { Name = "其他廠商" };
        context.Company.AddRange(acme, other);
        await context.SaveChangesAsync();
        context.Employee.AddRange(
            new Employee { Name = "A", StaffId = "EMP0001", Email = "a@example.com", CompanyId = acme.Id },
            new Employee { Name = "B", StaffId = "EMP0002", Email = "b@example.com", CompanyId = other.Id }
        );
        await context.SaveChangesAsync();

        var service = new EmployeeService(context, TestDb.CreateAuditMock().Object);

        var result = (await service.GetAllAsync("美合華")).ToList();

        var emp = Assert.Single(result);
        Assert.Equal("A", emp.Name);
        Assert.Equal("美合華科技", emp.Company?.Name);
    }
}
