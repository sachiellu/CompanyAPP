import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

interface Employee {
    id: number;
    name: string;
    position: string;
    email: string;
    companyName: string; // 來自後端的 DTO
}

export default function EmployeeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [emp, setEmp] = useState<Employee | null>(null);

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5203/api';

    useEffect(() => {
        const fetchEmployee = async () => {
            const token = localStorage.getItem('token');
            if (!token) { alert("請登入"); navigate('/login'); return; }

            const res = await fetch(`${baseUrl}/employees/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setEmp(await res.json());
            } else {
                alert("找不到資料");
                navigate('/employees');
            }
        };
        fetchEmployee();
    }, [id, baseUrl, navigate]);

    if (!emp) return <div className="p-5 text-center">載入中...</div>;

    return (
        <div className="container mt-4" style={{ maxWidth: '800px' }}>
            <div className="card shadow-sm border-0">
                <div className="card-header bg-info text-white">
                    <h4 className="mb-0">員工詳細資料</h4>
                </div>
                <div className="card-body p-4">
                    {/* 頭像與名稱區塊 */}
                    <div className="d-flex align-items-center mb-4 border-bottom pb-3">
                        <div className="bg-light rounded-circle d-flex justify-content-center align-items-center text-primary fw-bold fs-3"
                            style={{ width: 64, height: 64 }}>
                            {emp.name.charAt(0)}
                        </div>
                        <div className="ms-3">
                            <h2 className="mb-0 text-primary">{emp.name}</h2>
                            <span className="badge bg-secondary me-2">{emp.position}</span>
                            <span className="badge bg-success">{emp.companyName}</span>
                        </div>
                    </div>

                    {/* 詳細資訊 */}
                    <div className="row mb-3">
                        <div className="col-sm-3 fw-bold">電子信箱</div>
                        <div className="col-sm-9">{emp.email}</div>
                    </div>
                    <div className="row mb-3">
                        <div className="col-sm-3 fw-bold">所屬廠商</div>
                        <div className="col-sm-9">{emp.companyName}</div>
                    </div>

                    {/* 操作區 */}
                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Link to="/employees" className="btn btn-secondary">返回列表</Link>
                        <Link to={`/employees/edit/${emp.id}`} className="btn btn-primary px-4">編輯資料</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}