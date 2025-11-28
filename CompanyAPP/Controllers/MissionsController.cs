using CompanyAPP.Data;
using CompanyAPP.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace CompanyAPP.Controllers
{
    [Authorize]
    public class MissionsController : Controller
    {
        private readonly CompanyAppContext _context;

        public MissionsController(CompanyAppContext context)
        {
            _context = context;
        }

        // GET: Missions
        public async Task<IActionResult> Index()
        {
            var companyAppContext = _context.Mission.Include(m => m.Company).Include(m => m.Employee);
            return View(await companyAppContext.ToListAsync());
        }

        // GET: Missions/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var mission = await _context.Mission
                .Include(m => m.Company)
                .Include(m => m.Employee)
                .FirstOrDefaultAsync(m => m.Id == id);
            if (mission == null)
            {
                return NotFound();
            }

            return View(mission);
        }

        // GET: Missions/Create
        public IActionResult Create(int? employeeId)
        {
            var misson = new Mission
            {
                CreateDate = DateTime.Now,
                Deadline = DateTime.Now.AddDays(7),
                Status = MissionStatus.Pending
            };
            if (employeeId.HasValue)
            {
                misson.EmployeeId = employeeId.Value;
            }
            ViewData["CompanyId"] = new SelectList(_context.Company, "Id", "Name");
            ViewData["EmployeeId"] = new SelectList(_context.Employee, "Id", "Name", employeeId);
            
            return View(misson);
        }

        // POST: Missions/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Id,Title,Description,CreateDate,Deadline,Status,CompanyId,EmployeeId")] Mission mission)
        {
           // if (ModelState.IsValid)
            {
                _context.Add(mission);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            ViewData["CompanyId"] = new SelectList(_context.Company, "Id", "Name", mission.CompanyId);
            ViewData["EmployeeId"] = new SelectList(_context.Employee, "Id", "Name", mission.EmployeeId);

            return View(mission);
        }

        // GET: Missions/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var mission = await _context.Mission.FindAsync(id);
            if (mission == null)
            {
                return NotFound();
            }
            ViewData["CompanyId"] = new SelectList(_context.Company, "Id", "Name", mission.CompanyId);
            ViewData["EmployeeId"] = new SelectList(_context.Employee, "Id", "Name", mission.EmployeeId);
            return View(mission);
        }

        // POST: Missions/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,Title,Description,CreateDate,Deadline,Status,CompanyId,EmployeeId")] Mission mission)
        {
            if (id != mission.Id)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(mission);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!MissionExists(mission.Id))
                    {
                        return NotFound();
                    }
                    else
                    {
                        throw;
                    }
                }
                return RedirectToAction(nameof(Index));
            }
            ViewData["CompanyId"] = new SelectList(_context.Company, "Id", "Name", mission.CompanyId);
            ViewData["EmployeeId"] = new SelectList(_context.Employee, "Id", "Name", mission.EmployeeId);
            return View(mission);
        }

        // GET: Missions/Delete/5
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var mission = await _context.Mission
                .Include(m => m.Company)
                .Include(m => m.Employee)
                .FirstOrDefaultAsync(m => m.Id == id);
            if (mission == null)
            {
                return NotFound();
            }

            return View(mission);
        }

        // POST: Missions/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var mission = await _context.Mission.FindAsync(id);
            if (mission != null)
            {
                _context.Mission.Remove(mission);
            }

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        private bool MissionExists(int id)
        {
            return _context.Mission.Any(e => e.Id == id);
        }
    }
}
