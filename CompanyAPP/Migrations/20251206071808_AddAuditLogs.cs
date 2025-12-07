using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CompanyAPP.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    UserName = table.Column<string>(type: "TEXT", nullable: false),
                    EntityName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Action = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    KeyValues = table.Column<string>(type: "TEXT", nullable: false),
                    Changes = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");
        }
    }
}
