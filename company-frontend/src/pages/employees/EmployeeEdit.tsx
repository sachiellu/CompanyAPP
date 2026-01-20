import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

interface CompanyOption { id: number; name: string; }

export default function EmployeeEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [position, setPosition] = useState('');
    const [email, setEmail] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [companies, setCompanies] = useState<CompanyOption[]>([]);

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5203/api';

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { alert("請登入"); navigate('/login'); return; }

        const loadData = async () => {
            try {
                // 1. 先抓廠商選單 (跟新增頁一樣)
                const resComp = await fetch(`${baseUrl}/companies`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resComp.ok) setCompanies(await resComp.json());

                // 2. 再抓員工舊資料
                const resEmp = await fetch(`${baseUrl}/employees/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resEmp.ok) {
                    const data = await resEmp.json();
                    setName(data.name);
                    setPosition(data.position);
                    setEmail(data.email);
                    // 如果有 companyId 就填入，沒有就給空字串
                    setCompanyId(data.companyId ? data.companyId.toString() : "");
                }
            } catch (err) {
                console.error(err);
            }
        };
        loadData();
    }, [id, baseUrl, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        const payload = {
            name,
            position,
            email,
            companyId: companyId ? parseInt(companyId) : null
        };

        const res = await fetch(`${baseUrl}/employees/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("修改成功");
            navigate('/employees');
        } else {
            alert("修改失敗");
        }
    };

    return (
        <div className="container mt-4" style={{ maxWidth: '600px' }}>
            <div className="card shadow-sm">
                <div className="card-header bg-success text-white">
                    <h4 className="mb-0">編輯員工</h4>
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
                            <button type="submit" className="btn btn-success">保存修改</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}