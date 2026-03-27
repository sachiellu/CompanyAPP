import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';


interface Employee {
    id: number;
    name: string;
    position: string;
    email: string;
}

interface Company {
    id: number;
    name: string;
    industry: string;
    address: string;
    foundedDate: string;
    taxId: string;
    logoPath?: string;
    employees?: Employee[];
}

export default function CompanyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5203/api';
    const apiUrl = `${baseUrl}/companies/${id}`;

    useEffect(() => {
        const token = localStorage.getItem('token');
                
        if (!token) {
            alert("請先登入");
            navigate('/login');
            return;
        }

        fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => {
                if (res.status === 401) {
                    alert("登入過期，請重新登入");
                    navigate('/login');
                    throw new Error("Unauthorized");
                }
                if (!res.ok) throw new Error("找不到該廠商資料");
                return res.json();
            })
            .then((data: Company) => {
                // 在這裡直接修改 logoPath
                // 當資料剛從後端回來時，就幫它加上時間戳記
                if (data.logoPath) {
                    data.logoPath = `${data.logoPath}?t=${Date.now()}`;
                }

                // 然後才存入 State，這樣 React 渲染時只會看到已經改好的網址
                setCompany(data);
                setLoading(false);
            })
            .catch(err => {
                if (err.message !== "Unauthorized") {
                    setError(err.message);
                }
                setLoading(false);
            });
    }, [apiUrl, navigate]);

    if (loading) return <div className="p-5 text-center"> 載入中...</div>;
    if (error) return <div className="p-5 text-center text-danger">❌ {error}</div>;
    if (!company) return null;

    return (
        <div className="w-100">
            {/* 標題列 */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">廠商詳細資料</h2>
                <Link to="/" className="btn btn-outline-secondary">
                    返回列表
                </Link>
            </div>

            {/* 主卡片（滿版） */}
            <div className="card shadow-sm border-0 w-100">
                <div className="card-body p-4">

                    <div className="row g-4 align-items-center">
                        {/* Logo */}
                        <div className="col-md-3 text-center">
                            <div
                                className="border rounded bg-light d-flex align-items-center justify-content-center"
                                style={{ height: 160, overflow: 'hidden' }}
                            >
                                {/* 直接用 company.logoPath 即可，因為上面已經改過了 */}
                                {company.logoPath ? (
                                    <img
                                        src={company.logoPath}
                                        alt="Logo"
                                        className="img-fluid"
                                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                    />
                                ) : (
                                    <span className="text-muted">無 Logo</span>
                                )}
                            </div>
                        </div>

                        {/* 資料 (完全保留) */}
                        <div className="col-md-9">
                            <h3 className="fw-bold text-primary mb-3">
                                {company.name}
                            </h3>

                            <div className="row g-3">
                                <div className="col-md-6">
                                    <strong>統一編號</strong>
                                    <div className="text-muted">{company.taxId}</div>
                                </div>
                                <div className="col-md-6">
                                    <strong>產業類別</strong>
                                    <div className="text-muted">{company.industry}</div>
                                </div>
                                <div className="col-md-6">
                                    <strong>成立日期</strong>
                                    <div className="text-muted">
                                        {new Date(company.foundedDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <strong>地址</strong>
                                    <div className="text-muted">{company.address}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5">
                        <h4 className="border-bottom pb-2 mb-3">員工列表</h4>

                        {company.employees && company.employees.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th>姓名</th>
                                            <th>職位</th>
                                            <th>Email</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {company.employees.map(emp => (
                                            <tr key={emp.id}>
                                                <td>{emp.name}</td>
                                                <td>
                                                    <span className="badge bg-secondary">{emp.position}</span>
                                                </td>
                                                <td>{emp.email}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-muted text-center py-4 bg-light rounded">
                                尚無員工資料
                            </p>
                        )}
                    </div>

                    {/* 操作區 */}
                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Link to="/" className="btn btn-secondary">取消</Link>
                        <Link to={`/companies/edit/${company.id}`} className="btn btn-primary">
                            <i className="bi bi-pencil-square"></i> 編輯資料
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}