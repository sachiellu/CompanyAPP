import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/api';
import { type Employee, EmployeeStatus } from '../types';
import type { Company } from '../../companies/types';
import { useEscBack } from '../../../hooks/useEscBack';

export default function EmployeeEdit() {
    useEscBack('/employees');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [staffId, setStaffId] = useState("");
    const [name, setName] = useState("");
    const [position, setPosition] = useState("");
    const [email, setEmail] = useState("");
    const [companyId, setCompanyId] = useState("");
    const [status, setStatus] = useState<EmployeeStatus | string>("");
    const [companies, setCompanies] = useState<Company[]>([]);

    const loadInitialData = useCallback(async (employeeId: string) => {
        setLoading(true);
        try {
            const [resComp, resEmp] = await Promise.all([
                api.get<Company[]>('/companies'),
                api.get<Employee>(`/employees/${employeeId}`)
            ]);
            if (resComp.ok) setCompanies(resComp.data);
            if (resEmp.ok) {
                const emp = resEmp.data;
                setStaffId(emp.staffId || "");
                setName(emp.name || "");
                setPosition(emp.position || "");
                setEmail(emp.email || "");
                setCompanyId(emp.companyId?.toString() || "");
                setStatus(emp.status);
            }
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (id) loadInitialData(id);
    }, [id, loadInitialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const payload = { staffId, name, position, email, companyId: Number(companyId) };
        try {
            const res = await api.put(`/employees/${id}`, payload);
            if (res.ok) navigate('/employees');
        } finally { setLoading(false); }
    };

    return (
        <div className="page-container position-relative px-4 pt-3">
            {/* Header 對齊：按鈕移至右上角 */}
            <div className="page-header-wrapper d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>編輯員工資料 {loading && "..."}</h2>
                <Link to="/employees" className="btn btn-sm btn-outline-secondary px-3 shadow-sm text-nowrap">返回列表</Link>
            </div>

            <form onSubmit={handleSubmit} className="card shadow border-0 p-4 mx-auto text-start" style={{ maxWidth: '850px' }}>
                <div className="row g-3">
                    <div className="col-md-4">
                        <label className="form-label fw-bold text-secondary small text-uppercase">員工編號</label>
                        <input className="form-control form-control-sm" value={staffId} onChange={e => setStaffId(e.target.value)} />
                    </div>
                    <div className="col-md-8">
                        <label className="form-label fw-bold text-secondary small text-uppercase">姓名</label>
                        <input className="form-control form-control-sm" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label fw-bold text-secondary small text-uppercase">職位名稱</label>
                        <input className="form-control form-control-sm" value={position} onChange={e => setPosition(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label fw-bold text-secondary small text-uppercase">所屬廠商</label>
                        <select className="form-select form-select-sm" value={companyId} onChange={e => setCompanyId(e.target.value)} required>
                            <option value="">請選擇廠商</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="col-12">
                        <label className="form-label fw-bold text-secondary small text-uppercase">電子信箱</label>
                        <input type="email" className={`form-control form-control-sm ${status === EmployeeStatus.Active ? 'bg-light' : ''}`} value={email} readOnly={status === EmployeeStatus.Active} onChange={e => setEmail(e.target.value)} />
                    </div>
                </div>
                <div className="d-flex justify-content-end mt-5 pt-3 border-top">
                    <button type="submit" className="btn btn-sm btn-primary px-5 py-2 fw-bold shadow-sm" disabled={loading}>儲存變更內容</button>
                </div>
            </form>
        </div>
    );
}