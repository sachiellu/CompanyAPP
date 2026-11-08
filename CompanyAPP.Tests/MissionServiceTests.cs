using CompanyAPP.Models;
using CompanyAPP.Services.Missions;

namespace CompanyAPP.Tests;

public class MissionServiceTests
{
    [Fact]
    public async Task GetByIdAsync_ShouldReturnMissionWithCompanyAndEmployee()
    {
        using var context = TestDb.CreateContext();
        var (company, employee) = await SeedCompanyAndEmployee(context);
        var mission = new Mission
        {
            Title = "現場勘查",
            Description = "到廠確認設備",
            Deadline = DateTime.UtcNow.AddDays(3),
            Status = MissionStatus.Pending,
            CompanyId = company.Id,
            EmployeeId = employee.Id
        };
        context.Mission.Add(mission);
        await context.SaveChangesAsync();

        var service = new MissionService(context, TestDb.CreateAuditMock().Object);

        var result = await service.GetByIdAsync(mission.Id);

        Assert.NotNull(result);
        Assert.Equal("現場勘查", result.Title);
        Assert.Equal("到廠確認設備", result.Description);
        Assert.Equal(company.Id, result.CompanyId);
        Assert.Equal(employee.Id, result.EmployeeId);
        Assert.Equal("示範廠商", result.Company?.Name);
        Assert.Equal("王小明", result.Employee?.Name);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenMissing()
    {
        using var context = TestDb.CreateContext();
        var service = new MissionService(context, TestDb.CreateAuditMock().Object);

        var result = await service.GetByIdAsync(99);

        Assert.Null(result);
    }

    [Fact]
    public async Task AddAsync_ShouldSetCreateDateAndPersist()
    {
        using var context = TestDb.CreateContext();
        var (company, employee) = await SeedCompanyAndEmployee(context);
        var service = new MissionService(context, TestDb.CreateAuditMock().Object);
        var before = DateTime.UtcNow.AddMinutes(-1);

        await service.AddAsync(new Mission
        {
            Title = "派工建立",
            Deadline = DateTime.UtcNow.AddDays(1),
            Status = MissionStatus.Pending,
            CompanyId = company.Id,
            EmployeeId = employee.Id
        });

        var saved = Assert.Single(context.Mission);
        Assert.Equal("派工建立", saved.Title);
        Assert.True(saved.CreateDate >= before);
    }

    [Fact]
    public async Task UpdateAsync_ShouldChangeTitleAndAssignee()
    {
        using var context = TestDb.CreateContext();
        var (company, employee) = await SeedCompanyAndEmployee(context);
        var other = new Employee
        {
            Name = "陳大同",
            StaffId = "EMP0002",
            Email = "da@example.com",
            CompanyId = company.Id
        };
        context.Employee.Add(other);
        var mission = new Mission
        {
            Title = "原標題",
            Deadline = DateTime.UtcNow.AddDays(1),
            Status = MissionStatus.Pending,
            CompanyId = company.Id,
            EmployeeId = employee.Id
        };
        context.Mission.Add(mission);
        await context.SaveChangesAsync();

        var service = new MissionService(context, TestDb.CreateAuditMock().Object);
        await service.UpdateAsync(new Mission
        {
            Id = mission.Id,
            Title = "改派後標題",
            Description = "補說明",
            Deadline = DateTime.UtcNow.AddDays(5),
            Status = MissionStatus.Processing,
            CompanyId = company.Id,
            EmployeeId = other.Id
        });

        var saved = await service.GetByIdAsync(mission.Id);
        Assert.NotNull(saved);
        Assert.Equal("改派後標題", saved.Title);
        Assert.Equal("補說明", saved.Description);
        Assert.Equal(MissionStatus.Processing, saved.Status);
        Assert.Equal(other.Id, saved.EmployeeId);
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnNewestFirst()
    {
        using var context = TestDb.CreateContext();
        var (company, employee) = await SeedCompanyAndEmployee(context);
        context.Mission.AddRange(
            new Mission { Title = "舊任務", CreateDate = DateTime.UtcNow.AddDays(-2), Deadline = DateTime.UtcNow, CompanyId = company.Id, EmployeeId = employee.Id },
            new Mission { Title = "新任務", CreateDate = DateTime.UtcNow, Deadline = DateTime.UtcNow, CompanyId = company.Id, EmployeeId = employee.Id }
        );
        await context.SaveChangesAsync();

        var service = new MissionService(context, TestDb.CreateAuditMock().Object);

        var result = (await service.GetAllAsync()).ToList();

        Assert.Equal(2, result.Count);
        Assert.Equal("新任務", result[0].Title);
        Assert.Equal("舊任務", result[1].Title);
    }

    private static async Task<(Company company, Employee employee)> SeedCompanyAndEmployee(Data.CompanyAppContext context)
    {
        var company = new Company { Name = "示範廠商", TaxId = "00000000" };
        context.Company.Add(company);
        await context.SaveChangesAsync();

        var employee = new Employee
        {
            Name = "王小明",
            StaffId = "EMP0001",
            Email = "ming@example.com",
            CompanyId = company.Id
        };
        context.Employee.Add(employee);
        await context.SaveChangesAsync();

        return (company, employee);
    }
}
