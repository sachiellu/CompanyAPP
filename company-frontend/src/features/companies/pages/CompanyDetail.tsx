import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { companyApi } from '../api/companyApi';
import type { Company, Contact } from '../types'; 
import type { Employee } from '../../employees/types'; 
import { useEscBack } from '../../../hooks/useEscBack';
import { StatusBadge } from '../../employees/components/EmployeeStatusBadge';

export default function CompanyDetail() {
    useEscBack('/companies');
    const { id } = useParams<{ id: string }>();

    // 權限邏輯
    const userRole = localStorage.getItem('userRole') || 'User';
    const isAdmin = userRole === 'Admin';   
    const isManager = userRole === 'Manager';
    const canEdit = isAdmin || isManager;  
    const canExport = isAdmin;

    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(false);

    // API 網址處理 (用於 Logo 顯示)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5203/api';
    const backendUrl = apiUrl.replace(/\/api\/?$/, ''); 

    const fetchDetail = useCallback(async (compId: string) => {
        setLoading(true);
        try {
            const res = await companyApi.getCompanyById(compId);
            setCompany(res.data);
        } catch (err) {
            console.error(err);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { if (id) fetchDetail(id); }, [id, fetchDetail]);

    // 匯出 Excel 邏輯
    const handleExport = async () => {
        if (!company) return;
        try {
            const res = await companyApi.exportExcel([company.id]);
            const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${company.name}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a); 
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("導出失敗：", err);
        }
    };

    if (loading && !company) {
        return <div className="page-container p-5 text-center text-muted">載入中...</div>;
    }

    return (
        <div className="page-container position-relative px-4 pt-3">
            {/* Header 區塊 */}
            <div className="page-header-wrapper d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>
                    廠商詳情 {loading && <span className="spinner-border spinner-border-sm ms-2"></span>}
                </h2>
                <div className="d-flex align-items-center gap-2">
                    {canExport && (
                        <button className="btn btn-sm btn-outline-success px-3 shadow-sm" onClick={handleExport}>
                            匯出資料
                        </button>
                    )}
                    {canEdit && (
                        <Link to={`/companies/edit/${id}`} className="btn btn-sm btn-primary px-3 shadow-sm">
                            編輯資料
                        </Link>
                    )}
                    <Link to="/companies" className="btn btn-sm btn-outline-secondary px-3 shadow-sm">
                        返回列表
                    </Link>
                </div>
            </div>

            {company && (
                <div className="mx-auto" style={{ maxWidth: '1000px' }}>
                    {/* 廠商基本資料卡片 */}
                    <div className="card shadow-sm border-0 mb-4 text-start">
                        <div className="card-body p-4">
                            <div className="row align-items-center text-start">
                                <div className="col-md-auto pe-4 border-end text-center" style={{ minWidth: '240px' }}>
                                    <div className="bg-light border mb-2 mx-auto d-flex align-items-center justify-content-center" style={{ width: '160px', height: '160px' }}>
                                        {company.logoPath ? (
                                            <img 
                                                src={company.logoPath.startsWith('http') ? company.logoPath : `${backendUrl}${company.logoPath}`} 
                                                className="w-100 h-100 object-fit-contain" 
                                                alt="logo" 
                                            />
                                        ) : (
                                            <div className="text-muted small">No Logo</div>
                                        )}
                                    </div>
                                    <h5 className="fw-bold m-0 text-primary">{company.name}</h5>
                                </div>
                                <div className="col-md ps-4">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="small text-muted fw-bold d-block text-uppercase mb-1">統一編號</label>
                                            <span style={{ fontSize: '14px' }}>{company.taxId || '-'}</span>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="small text-muted fw-bold d-block text-uppercase mb-1">產業類別</label>
                                            <span style={{ fontSize: '14px' }}>{company.industry || '-'}</span>
                                        </div>
                                        <div className="col-12 mt-3">
                                            <label className="small text-muted fw-bold d-block text-uppercase mb-1">通訊地址</label>
                                            <span style={{ fontSize: '14px' }}>{company.address || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 內部員工清單 */}
                    <div className="card shadow-sm border-0 mb-4 text-start">
                        <div className="card-header bg-light py-2 px-4 border-bottom">
                            <span className="text-secondary fw-bold small text-uppercase">內部員工</span>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0 align-middle" style={{ fontSize: '13px' }}>
                                    <thead className="table-light">
                                        <tr>
                                            <th className="px-4">工號</th>
                                            <th>姓名</th>
                                            <th>職位</th>
                                            <th>狀態</th>
                                            <th className="text-end px-4">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {company.employees && company.employees.length > 0 ? (
                                            company.employees.map((emp: Employee) => (
                                                <tr key={emp.id}>
                                                    <td className="px-4"><code>{emp.staffId || '待編'}</code></td>
                                                    <td className="fw-bold">{emp.name}</td>
                                                    <td>{emp.position}</td>
                                                    <td><StatusBadge status={emp.status} /></td>
                                                    <td className="text-end px-4">
                                                        <Link to={`/employees/${emp.id}`} className="btn btn-xs btn-outline-primary py-1 px-2">詳情</Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="text-center py-4 text-muted">
                                                    目前尚無內部員工資料
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* 外部窗口清單 */}
                    <div className="card shadow-sm border-0 text-start">
                        <div className="card-header bg-light py-2 px-4 border-bottom">
                            <span className="text-secondary fw-bold small text-uppercase">外部窗口</span>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-sm table-borderless mb-0 align-middle" style={{ fontSize: '13px' }}>
                                    <thead className="table-light">
                                        <tr>
                                            <th className="px-4 py-2">姓名</th>
                                            <th>電話</th>
                                            <th>Email</th>
                                            <th className="px-4">備註</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {company.contacts && company.contacts.length > 0 ? (
                                            company.contacts.map((c: Contact) => (
                                                <tr key={c.id} className="border-bottom">
                                                    <td className="px-4 fw-bold">{c.name}</td>
                                                    <td>{c.phone}</td>
                                                    <td>{c.email}</td>
                                                    <td className="px-4 text-muted small">{c.remark}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="text-center py-3 text-muted">暫無聯絡窗口</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}