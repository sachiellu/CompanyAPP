using System;
using CompanyAPP.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CompanyAPP.Migrations
{
    [DbContext(typeof(CompanyAppContext))]
    [Migration("20261109040000_AddEmployeeInviteToken")]
    public partial class AddEmployeeInviteToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "InviteExpiresAt",
                table: "Employee",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InviteTokenHash",
                table: "Employee",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InviteExpiresAt",
                table: "Employee");

            migrationBuilder.DropColumn(
                name: "InviteTokenHash",
                table: "Employee");
        }
    }
}
