namespace CompanyAPP.Models
{
	public class ContactDto
	{
		public int Id { get; set; }
		public string Name { get; set; } = string.Empty;
		public string? Phone { get; set; }
		public string? Email { get; set; }
		public string? Remark { get; set; }
	}
}