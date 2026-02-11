// src/features/employees/components/EmployeeFormFields.tsx
import type { Company } from '../../companies/types';

interface EmployeeData {
    staffId: string;
    name: string;
    position: string;
    email: string;
    companyId: string;
    status?: string; // 用來判斷是否鎖死 Email
}

interface Props {
    data: EmployeeData;
    companies: Company[];
    onChange: (key: string, value: string) => void;
    isEdit?: boolean; // 是否為編輯模式
}

export function EmployeeFormFields({ data, companies, onChange, isEdit }: Props) {
    return (
        <div className="row g-3 text-start">
            <div className="col-md-4">
                <label className="form-label fw-bold text-secondary small text-uppercase">員工編號</label>
                <input className="form-control form-control-sm" value={data.staffId} onChange={e => onChange('staffId', e.target.value)} placeholder="如：EMP001" />
            </div>
            <div className="col-md-8">
                <label className="form-label fw-bold text-secondary small text-uppercase">姓名</label>
                <input className="form-control form-control-sm" value={data.name} onChange={e => onChange('name', e.target.value)} required />
            </div>
            <div className="col-md-6">
                <label className="form-label fw-bold text-secondary small text-uppercase">職位名稱</label>
                <input className="form-control form-control-sm" value={data.position} onChange={e => onChange('position', e.target.value)} />
            </div>
            <div className="col-md-6">
                <label className="form-label fw-bold text-secondary small text-uppercase">所屬廠商</label>
                <select className="form-select form-select-sm" value={data.companyId} onChange={e => onChange('companyId', e.target.value)} required>
                    <option value="">請選擇廠商</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div className="col-12">
                <label className="form-label fw-bold text-secondary small text-uppercase">電子信箱</label>
                <input
                    type="email"
                    className={`form-control form-control-sm ${isEdit && data.status === 'Active' ? 'bg-light' : ''}`}
                    value={data.email}
                    onChange={e => onChange('email', e.target.value)}
                    readOnly={isEdit && data.status === 'Active'}
                />
                {isEdit && data.status === 'Active' && <small className="text-muted">已註冊帳號，Email 不可修改。</small>}
            </div>
        </div>
    );
}