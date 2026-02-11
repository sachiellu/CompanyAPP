using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;


namespace CompanyAPP.Services
{
    public class CompanyService : ICompanyService
    {
        private readonly CompanyAppContext _context;
        private readonly IImageService _imageService;

        public CompanyService(CompanyAppContext context, IImageService imageService)
        {
            _context = context;
            _imageService = imageService;
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
                .Include(c => c.Employees) // 包含員工
                .Include(c => c.Contacts)  // 修正：也要包含聯絡人
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task AddAsync(Company company)
        {
            if (company.ImageFile != null)
                company.LogoPath = await _imageService.UploadImageAsync(company.ImageFile);
            else
                company.LogoPath = "default_company_logo.png";

            _context.Add(company);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Company updatedCompany, List<ContactDto> contactDtos)
        {
            // 1. 處理圖片 (保持原本邏輯)
            if (updatedCompany.ImageFile != null)
                updatedCompany.LogoPath = await _imageService.UploadImageAsync(updatedCompany.ImageFile);

            // 2. 處理聯絡人同步邏輯
            var existingCompany = await _context.Company
                .Include(c => c.Contacts)
                .FirstOrDefaultAsync(c => c.Id == updatedCompany.Id);

            if (existingCompany != null)
            {
                _context.Entry(existingCompany).CurrentValues.SetValues(updatedCompany);

                // 移除不在前端傳回來清單中的聯絡人 (Delete)
                var dtoIds = contactDtos.Select(d => d.Id).ToList();
                var toRemove = existingCompany.Contacts.Where(c => !dtoIds.Contains(c.Id)).ToList();
                foreach (var r in toRemove) _context.Remove(r);

                // 更新或新增 (Update / Create)
                foreach (var dto in contactDtos)
                {
                    var existingContact = existingCompany.Contacts.FirstOrDefault(c => c.Id == dto.Id && c.Id != 0);
                    if (existingContact != null)
                    {
                        // 更新舊有聯絡人
                        existingContact.Name = dto.Name; 
                        existingContact.Phone = dto.Phone;
                        existingContact.Email = dto.Email; 
                        existingContact.Remark = dto.Remark;
                    }
                    else
                    {
                        // 新增聯絡人
                        existingCompany.Contacts.Add(new Contact
                        {
                            Name = dto.Name,
                            Phone = dto.Phone,
                            Email = dto.Email,
                            Remark = dto.Remark
                        });
                    }
                }

                _context.Update(existingCompany);
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteAsync(int id)
        {
            var company = await _context.Company.FindAsync(id);
            if (company != null)
            {
                _context.Company.Remove(company);
                await _context.SaveChangesAsync();
            }
        }

        public bool CompanyExists(int id) => _context.Company.Any(e => e.Id == id);

        // ============================================================
        // 核心優化：支援「巢狀資料」匯出的 Excel 邏輯
        // ============================================================
        public async Task<byte[]> ExportToExcelAsync(List<int>? ids = null)
        {
            var query = _context.Company
                .Include(c => c.Employees) // 載入員工
                .Include(c => c.Contacts)  // 載入聯絡人
                .AsQueryable();

            if (ids != null && ids.Any())
            {
                query = query.Where(c => ids.Contains(c.Id));
            }
            var companies = await query.ToListAsync();

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("廠商詳細清單");

                // 1. 設定表頭 (擴充欄位以顯示人員資訊)
                string[] headers = { "廠商名稱", "統一編號", "產業", "地址", "人員類別", "姓名", "職位/備註", "Email/電話" };
                for (int i = 0; i < headers.Length; i++)
                {
                    worksheet.Cell(1, i + 1).Value = headers[i];
                }

                // 設定表頭樣式
                var headerRange = worksheet.Range("A1:H1");
                headerRange.Style.Font.Bold = true;
                headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

                int row = 2;
                foreach (var c in companies)
                {
                    // 邏輯：一個廠商可能有多個人員，我們每一行都重寫一次廠商資訊，確保資料完整

                    // --- A. 先處理系統員工 ---
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

                    // --- B. 再處理外部聯絡人 ---
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

                    // --- C. 如果完全沒人員，也要留一行顯示廠商 ---
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

        // 輔助方法：填寫廠商基本資訊
        private void WriteCompanyInfo(IXLWorksheet sheet, int row, Company c)
        {
            sheet.Cell(row, 1).Value = c.Name;
            sheet.Cell(row, 2).SetValue(c.TaxId).Style.NumberFormat.Format = "@";
            sheet.Cell(row, 3).Value = c.Industry;
            sheet.Cell(row, 4).Value = c.Address;
        }
    }
}