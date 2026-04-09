using ClosedXML.Excel;
using CompanyAPP.Data;
using CompanyAPP.Models;
using CompanyAPP.Services.Common;
using CompanyAPP.Services.Companies;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace CompanyAPP.Services.Companies
{
    public class CompanyService : ICompanyService
    {
        private readonly CompanyAppContext _context;
        private readonly IImageService _imageService;
        private readonly AuditService _auditService;

        public CompanyService(CompanyAppContext context, IImageService imageService, AuditService auditService)
        {
            _context = context;
            _imageService = imageService;
            _auditService = auditService;
        }

        public async Task<List<Company>> GetAllAsync(string searchString)
        {
            var companies = _context.Company.AsQueryable();
            if (!string.IsNullOrEmpty(searchString))
            {
                companies = companies.Where(c => c.Name.Contains(searchString));
            }
            return await companies.ToListAsync();
        }

        public async Task<Company?> GetByIdAsync(int? id)
        {
            if (id == null) return null;
            return await _context.Company
                .Include(c => c.Employees)
                .Include(c => c.Contacts)
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task AddAsync(Company company)
        {
            if (company.ImageFile != null)
                company.LogoPath = await _imageService.UploadImageAsync(company.ImageFile);
            else if (string.IsNullOrEmpty(company.LogoPath))
                company.LogoPath = "default_company_logo.png";

            _context.Add(company);
            await _context.SaveChangesAsync();

            await _auditService.LogAsync("Company", "Create", $"Id: {company.Id}", $"建立了廠商: {company.Name}");
        }

        // 核心修正：對齊介面使用 List<Contact>
        public async Task UpdateAsync(Company updatedCompany, List<Contact> contacts)
        {
            // 從資料庫抓出舊的 Company 資料
            var existingCompany = await _context.Company
                .Include(c => c.Contacts)
                .FirstOrDefaultAsync(c => c.Id == updatedCompany.Id);

            if (existingCompany != null)
            {
                // 1. 更新基本欄位
                existingCompany.Name = updatedCompany.Name;
                existingCompany.Industry = updatedCompany.Industry;
                existingCompany.Address = updatedCompany.Address;
                existingCompany.TaxId = updatedCompany.TaxId;

                if (updatedCompany.FoundedDate.HasValue)
                {
                    existingCompany.FoundedDate = updatedCompany.FoundedDate.Value;
                }

                if (!string.IsNullOrEmpty(updatedCompany.LogoPath))
                {
                    existingCompany.LogoPath = updatedCompany.LogoPath;
                }

                // 2. 處理聯絡人 (Delete/Update/Create)
                // 移除不在新清單中的舊聯絡人
                var newIds = contacts.Select(d => d.Id).ToList();
                var toRemove = existingCompany.Contacts.Where(c => !newIds.Contains(c.Id)).ToList();
                foreach (var r in toRemove) _context.Remove(r);

                // 更新或新增
                foreach (var contact in contacts)
                {
                    var existingContact = existingCompany.Contacts.FirstOrDefault(c => c.Id == contact.Id && c.Id != 0);
                    if (existingContact != null)
                    {
                        existingContact.Name = contact.Name;
                        existingContact.Phone = contact.Phone;
                        existingContact.Email = contact.Email;
                        existingContact.Remark = contact.Remark;
                    }
                    else
                    {
                        // 確保新聯絡人有關聯到正確的 CompanyId
                        contact.CompanyId = updatedCompany.Id;
                        existingCompany.Contacts.Add(contact);
                    }
                }

                await _context.SaveChangesAsync();

                await _auditService.LogAsync("Company", "Update", $"Id: {updatedCompany.Id}", $"修改了廠商: {updatedCompany.Name} 的資料");
            }
        }

        public async Task DeleteAsync(int id)
        {
            var company = await _context.Company.FindAsync(id);
            if (company != null)
            {
                string companyName = company.Name;

                _context.Company.Remove(company);
                await _context.SaveChangesAsync();

                await _auditService.LogAsync("Company", "Delete", $"Id: {id}", $"刪除了廠商: {companyName}");
            }
        }

        public bool CompanyExists(int id) => _context.Company.Any(e => e.Id == id);

        public async Task<byte[]> ExportToExcelAsync(List<int>? ids = null)
        {
            var query = _context.Company
                .Include(c => c.Employees)
                .Include(c => c.Contacts)
                .AsQueryable();

            if (ids != null && ids.Any())
            {
                query = query.Where(c => ids.Contains(c.Id));
            }
            var companies = await query.ToListAsync();

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("廠商詳細清單");
                string[] headers = { "廠商名稱", "統一編號", "產業", "地址", "人員類別", "姓名", "職位/備註", "Email/電話" };
                for (int i = 0; i < headers.Length; i++)
                {
                    worksheet.Cell(1, i + 1).Value = headers[i];
                }

                var headerRange = worksheet.Range("A1:H1");
                headerRange.Style.Font.Bold = true;
                headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

                int row = 2;
                foreach (var c in companies)
                {
                    if (c.Employees != null && c.Employees.Any())
                    {
                        foreach (var emp in c.Employees)
                        {
                            WriteCompanyInfo(worksheet, row, c);
                            worksheet.Cell(row, 5).Value = "系統員工";
                            worksheet.Cell(row, 6).Value = emp.Name;
                            worksheet.Cell(row, 7).Value = emp.Position;
                            worksheet.Cell(row, 8).Value = emp.Email;
                            row++;
                        }
                    }

                    if (c.Contacts != null && c.Contacts.Any())
                    {
                        foreach (var con in c.Contacts)
                        {
                            WriteCompanyInfo(worksheet, row, c);
                            worksheet.Cell(row, 5).Value = "行政窗口";
                            worksheet.Cell(row, 6).Value = con.Name;
                            worksheet.Cell(row, 7).Value = con.Remark;
                            worksheet.Cell(row, 8).Value = con.Phone;
                            row++;
                        }
                    }

                    if ((c.Employees == null || !c.Employees.Any()) && (c.Contacts == null || !c.Contacts.Any()))
                    {
                        WriteCompanyInfo(worksheet, row, c);
                        worksheet.Cell(row, 5).Value = "(無人員資料)";
                        row++;
                    }
                }

                worksheet.Columns().AdjustToContents();
                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    return stream.ToArray();
                }
            }
        }

        private void WriteCompanyInfo(IXLWorksheet sheet, int row, Company c)
        {
            sheet.Cell(row, 1).Value = c.Name;
            sheet.Cell(row, 2).SetValue(c.TaxId).Style.NumberFormat.Format = "@";
            sheet.Cell(row, 3).Value = c.Industry;
            sheet.Cell(row, 4).Value = c.Address;
        }
    }
}