// src/features/missions/components/MissionFormFields.tsx
import type { Company } from '../../companies/types'; // 修正：加上 type
import type { Employee } from '../../employees/types'; // 修正：加上 type

interface MissionData {
    title: string;
    description: string;
    createDate: string;
    deadline: string;
    status: string;
    companyId: string;
    employeeId: string;
}

interface Props {
    data: MissionData;
    companies: Company[];
    employees: Employee[];
    onChange: (key: string, value: string) => void;
}

export function MissionFormFields({ data, companies, employees, onChange }: Props) {
    return (
        <div className="row g-3 text-start">
            <div className="col-12">
                <label className="form-label fw-bold text-secondary small text-uppercase">任務名稱</label>
                <div className="input-group">
                    <select
                        className="form-select border-primary-subtle"
                        style={{ maxWidth: '160px' }}
                        onChange={(e) => {
                            if (e.target.value === 'Other') onChange('title', '');
                            else onChange('title', e.target.value);
                        }}
                    >
                        <option value="">-- 快速選擇 --</option>
                        <option value="設備維修">設備維修</option>
                        <option value="系統安裝">系統安裝</option>
                        <option value="定期保養">定期保養</option>
                        <option value="Other">➕ 自定義...</option>
                    </select>
                    <input className="form-control" value={data.title} onChange={e => onChange('title', e.target.value)} required placeholder="請輸入或選擇任務名稱" />
                </div>
            </div>

            <div className="col-md-6">
                <label className="form-label fw-bold text-secondary small text-uppercase">所屬廠商</label>
                <select className="form-select" value={data.companyId} onChange={e => onChange('companyId', e.target.value)} required>
                    <option value="">-- 請選擇廠商 --</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="col-md-6">
                <label className="form-label fw-bold text-secondary small text-uppercase">指派員工</label>
                <select className="form-select" value={data.employeeId} onChange={e => onChange('employeeId', e.target.value)} required>
                    <option value="">-- 請選擇員工 --</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
            </div>

            <div className="col-md-6">
                <label className="form-label fw-bold text-secondary small text-uppercase">建立日期</label>
                <input type="date" className="form-control" value={data.createDate} onChange={e => onChange('createDate', e.target.value)} />
            </div>

            <div className="col-md-6">
                <label className="form-label fw-bold text-secondary small text-uppercase">截止日期</label>
                <input type="date" className="form-control" value={data.deadline} onChange={e => onChange('deadline', e.target.value)} />
            </div>

            <div className="col-12">
                <label className="form-label fw-bold text-secondary small text-uppercase">任務描述</label>
                <textarea className="form-control" rows={3} value={data.description} onChange={e => onChange('description', e.target.value)} />
            </div>
        </div>
    );
}