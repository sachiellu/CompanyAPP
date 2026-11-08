using CompanyAPP.Controllers.Api;
using CompanyAPP.Dtos.Missions;
using CompanyAPP.Models;
using CompanyAPP.Services.Missions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace CompanyAPP.Tests;

public class MissionsApiControllerTests
{
    [Fact]
    public async Task GetMission_ShouldReturnNotFound_WhenMissing()
    {
        var missions = new Mock<IMissionService>();
        missions.Setup(s => s.GetByIdAsync(99)).ReturnsAsync((Mission?)null);
        var controller = new MissionsApiController(missions.Object, TestDb.CreateAuditMock().Object);

        var result = await controller.GetMission(99);

        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal(404, notFound.StatusCode);
    }

    [Fact]
    public async Task GetMission_ShouldReturnDetailFields_WhenFound()
    {
        var missions = new Mock<IMissionService>();
        missions.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(new Mission
        {
            Id = 1,
            Title = "現場勘查",
            Description = "到廠確認設備",
            CreateDate = new DateTime(2026, 11, 5),
            Deadline = new DateTime(2026, 11, 8),
            Status = MissionStatus.Pending,
            CompanyId = 2,
            EmployeeId = 3,
            Company = new Company { Id = 2, Name = "示範廠商" },
            Employee = new Employee { Id = 3, Name = "王小明", Email = "ming@example.com", CompanyId = 2 }
        });
        var controller = new MissionsApiController(missions.Object, TestDb.CreateAuditMock().Object);

        var result = await controller.GetMission(1);

        var ok = Assert.IsType<OkObjectResult>(result);
        var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
        using var doc = System.Text.Json.JsonDocument.Parse(json);
        var root = doc.RootElement;
        Assert.Equal(1, root.GetProperty("Id").GetInt32());
        Assert.Equal("現場勘查", root.GetProperty("Title").GetString());
        Assert.Equal("到廠確認設備", root.GetProperty("Description").GetString());
        Assert.Equal(2, root.GetProperty("CompanyId").GetInt32());
        Assert.Equal(3, root.GetProperty("EmployeeId").GetInt32());
        Assert.Equal("示範廠商", root.GetProperty("CompanyName").GetString());
        Assert.Equal("王小明", root.GetProperty("EmployeeName").GetString());
        Assert.Equal("Pending", root.GetProperty("Status").GetString());
    }

    [Fact]
    public async Task CreateMission_ShouldCallAddAsync()
    {
        var missions = new Mock<IMissionService>();
        Mission? created = null;
        missions.Setup(s => s.AddAsync(It.IsAny<Mission>()))
            .Callback<Mission>(m => created = m)
            .Returns(Task.CompletedTask);
        var controller = new MissionsApiController(missions.Object, TestDb.CreateAuditMock().Object);

        var result = await controller.CreateMission(new MissionCreateDto
        {
            Title = "派工建立",
            Description = "說明",
            Deadline = DateTime.UtcNow.AddDays(1),
            Status = "Pending",
            CompanyId = 2,
            EmployeeId = 3
        });

        Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(created);
        Assert.Equal("派工建立", created.Title);
        Assert.Equal(2, created.CompanyId);
        Assert.Equal(3, created.EmployeeId);
        Assert.Equal(MissionStatus.Pending, created.Status);
    }

    [Fact]
    public async Task UpdateMission_ShouldRejectWhenCompanyOrEmployeeMissing()
    {
        var missions = new Mock<IMissionService>();
        var controller = new MissionsApiController(missions.Object, TestDb.CreateAuditMock().Object);

        var result = await controller.UpdateMission(1, new MissionUpdateDto
        {
            Title = "編輯任務",
            CompanyId = 0,
            EmployeeId = 0
        });

        Assert.IsType<BadRequestObjectResult>(result);
        missions.Verify(s => s.UpdateAsync(It.IsAny<Mission>()), Times.Never);
    }
}
