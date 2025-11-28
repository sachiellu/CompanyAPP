using Microsoft.EntityFrameworkCore;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace CompanyAPP.Data
{
    public class CompanyAppContext : IdentityDbContext
    {
        public CompanyAppContext(DbContextOptions<CompanyAppContext> options)
            : base(options)
        {
        }

        public DbSet<Company> Company { get; set; } = default!;

        public DbSet<Employee> Employee { get; set; } = default!;
        public DbSet<Mission> Mission { get; set; } = default!;
    }
}