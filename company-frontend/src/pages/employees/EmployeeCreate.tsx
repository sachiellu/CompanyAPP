import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface CompanyOption { id: number; name: string; }

export default function EmployeeCreate() {
    const [name, setName] = useState('');
    const [position, setPosition] = useState('');
    const [email, setEmail] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [companies, setCompanies] = useState<CompanyOption[]>([]); // 廠商選單

    const navigate = useNavigate();
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5203/api';

    // 1. 載入廠商選單
    useEffect(() => {
        const fetchCompanies = async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${baseUrl}/companies`, { // 借用廠商 API
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setCompanies(await res.json());
        };
        fetchCompanies();
    }, [baseUrl]);

    // 2. 送出
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        const payload = {
            name,
            position,
            email,
            companyId: companyId ? parseInt(companyId) : null
        };

        const res = await fetch(`${baseUrl}/employees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("新增成功");
            navigate('/employees');
        } else {
            alert("新增失敗");
        }
    };

    return (
        <div className="container mt-4" style={{ maxWidth: '600px' }}>
            <div className="card shadow-sm">
                <div className="card-header bg-primary text-white">
                    <h4 className="mb-0">新增員工</h4>
                </div>
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label fw-bold">姓名</label>
                            <input className="form-control" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">職位</label>
                                <input className="form-control" value={position} onChange={e => setPosition(e.target.value)} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                        </div>

                        {/*  廠商下拉選單 */}
                        <div className="mb-3">
                            <label className="form-label fw-bold">所屬廠商</label>
                            <select className="form-select" value={companyId} onChange={e => setCompanyId(e.target.value)}>
                                <option value="">-- 請選擇廠商 --</option>
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="d-flex justify-content-end gap-2">
                            <Link to="/employees" className="btn btn-secondary">取消</Link>
                            <button type="submit" className="btn btn-primary">確認新增</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}