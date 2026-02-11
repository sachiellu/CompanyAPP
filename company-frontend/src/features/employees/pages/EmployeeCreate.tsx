import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../../services/api';
import type { Company } from '../../companies/types';
import { useEscBack } from '../../../hooks/useEscBack';

export default function EmployeeCreate() {
    useEscBack('/employees');
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [position, setPosition] = useState('');
    const [email, setEmail] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get<Company[]>('/companies').then(res => {
            if (res.ok) setCompanies(res.data);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { name, position, email, companyId: Number(companyId) };
            const res = await api.post('/employees', payload);
            if (res.ok) navigate('/employees');
        } finally { setLoading(false); }
    };

    return (
        <div className="page-container position-relative px-4 pt-3">
            {/* Header 對齊 */}
            <div className="page-header-wrapper d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>新增員工資料</h2>
                <Link to="/employees" className="btn btn-sm btn-outline-secondary px-3 shadow-sm">返回列表</Link>
            </div>

            <form onSubmit={handleSubmit} className="card shadow border-0 p-4 mx-auto text-start" style={{ maxWidth: '850px' }}>
                <div className="row g-3">
                    <div className="col-md-12">
                        <label className="form-label fw-bold text-secondary small text-uppercase">姓名</label>
                        <input className="form-control form-control-sm" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label fw-bold text-secondary small text-uppercase">職位</label>
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
                        <input type="email" className="form-control form-control-sm" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                </div>
                <div className="d-flex justify-content-end mt-5 pt-3 border-top">
                    <button type="submit" className="btn btn-sm btn-primary px-5 py-2 fw-bold shadow-sm" disabled={loading}>確認建立員工</button>
                </div>
            </form>
        </div>
    );
}