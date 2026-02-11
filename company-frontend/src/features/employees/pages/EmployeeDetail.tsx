import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/api';
// 修正：正確 import 型別
import type { Employee } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useEscBack } from '../../../hooks/useEscBack';

export default function EmployeeDetail() {
    useEscBack('/employees');
    const { id } = useParams<{ id: string }>();
    // 修正：使用型別取代 any
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchDetail = useCallback(async (empId: string) => {
        setLoading(true);
        try {
            const res = await api.get<Employee>(`/employees/${empId}`);
            if (res.ok) setEmployee(res.data);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { if (id) fetchDetail(id); }, [id, fetchDetail]);

    return (
        <div className="page-container position-relative px-4 pt-3">
            <div className="page-header-wrapper d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>員工詳情 {loading && "..."}</h2>
                <div className="d-flex gap-2">
                    <Link to={`/employees/edit/${id}`} className="btn btn-sm btn-outline-success px-3 shadow-sm">編輯資料</Link>
                    <Link to="/employees" className="btn btn-sm btn-outline-secondary px-3 shadow-sm">返回列表</Link>
                </div>
            </div>

            {employee && (
                <div className="card shadow-sm border-0 rounded overflow-hidden mx-auto text-start" style={{ maxWidth: '800px' }}>
                    <div className="card-header bg-light py-2 px-4 border-bottom text-secondary fw-bold small">基本資訊</div>
                    <div className="card-body p-4">
                        <div className="row g-4">
                            <div className="col-md-6"><label className="text-muted small d-block mb-1 fw-bold">員工編號</label><code className="fs-5 text-primary fw-bold">{employee.staffId || '待編'}</code></div>
                            <div className="col-md-6 text-end"><label className="text-muted small d-block mb-1 fw-bold">狀態</label><StatusBadge status={employee.status} /></div>
                            <div className="col-md-6 border-top pt-3"><label className="text-muted small d-block mb-1 fw-bold">姓名</label><div className="fw-bold">{employee.name}</div></div>
                            <div className="col-md-6 border-top pt-3"><label className="text-muted small d-block mb-1 fw-bold">職位</label><div>{employee.position || '-'}</div></div>
                            <div className="col-12 border-top pt-3"><label className="text-muted small d-block mb-1 fw-bold">電子信箱</label><div>{employee.email}</div></div>
                            <div className="col-12 border-top pt-3">
                                <label className="text-muted small d-block mb-1 fw-bold">所屬公司</label>
                                <span className="badge bg-info-subtle text-info border border-info-subtle px-3 py-1">
                                    {employee.companyName || '尚未分配'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}