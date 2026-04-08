import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';
import type { Mission } from '../types';
import { MissionStatusBadge } from '../components/MissionStatusBadge';


export default function MissionList() {
    // 權限邏輯
    const userRole = localStorage.getItem('userRole') || 'User';
    const isAdmin = userRole === 'Admin';
    const isManager = userRole === 'Manager';

    // 任務的權限操作能力
    const canEdit = isAdmin || isManager; // 新增、編輯任務 (Manager 可以派工)
    const canDelete = isAdmin;            // 刪除任務 (只有 Admin 能刪除)

    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchMissions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<Mission[]>('/missions');
            setMissions(res.data || []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMissions(); }, [fetchMissions]);

    const handleDelete = async (id: number) => {
        if (!confirm("確定要刪除此任務嗎？")) return;
        
        try {
            // 直接呼叫 api 刪除
            await api.delete(`/missions/${id}`);
            setMissions(prev => prev.filter(m => m.id !== id));

        } catch (err) {
            // 如果後端報錯 (400, 403, 500)，Axios 會自動跳來這裡
            console.error("刪除出錯", err);
            // 如果你有全域攔截器，這裡可以改成 alert(err.processedMessage)
            alert("刪除失敗！可能權限不足。");
        }
    };

    return (
        <div className="page-container position-relative px-4 pt-3">
            <div className="page-header-wrapper d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>
                    任務派工 {loading && <span className="spinner-border spinner-border-sm ms-2 text-primary"></span>}
                </h2>
                {canEdit &&
                    <Link to="/missions/create" className="btn btn-sm btn-primary text-nowrap px-3 shadow-sm">
                        <i className="bi bi-plus-lg me-1"></i>發布新任務
                    </Link>
                }
            </div>

            <div className="page-content bg-white shadow-sm rounded overflow-hidden">
                <table className="table table-hover align-middle mb-0 text-start" style={{ fontSize: '14px' }}>
                    <thead className="table-light">
                        <tr style={{ fontSize: '13px' }}>
                            <th className="px-4 py-3">任務標題</th>
                            <th>指派對象</th>
                            <th>所屬廠商</th>
                            <th>期限</th>
                            <th>狀態</th>
                            <th className="text-end px-4">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {missions.map(m => (
                            <tr key={m.id}>
                                <td className="px-4 fw-bold text-dark">{m.title}</td>
                                <td>
                                    {/* 顯示員工姓名，若無則顯示編號 */}
                                    {m.employeeName || <code className="small">{m.employeeId}</code>}
                                </td>
                                <td>
                                    <span className="badge bg-light text-dark border fw-normal" style={{ fontSize: '12px' }}>
                                        {m.companyName || '未分類'}
                                    </span>
                                </td>
                                <td className="text-muted small">
                                    {m.deadline ? m.deadline.split('T')[0] : '-'}
                                </td>
                                <td>
                                    <MissionStatusBadge status={m.status} />
                                </td>
                                <td className="text-end px-4 d-flex justify-content-end gap-2">
                                    <Link to={`/missions/${m.id}`} className="btn btn-xs btn-outline-primary" style={{ fontSize: '11px', padding: '2px 8px' }}>詳情</Link>
                                    
                                    {/* 編輯按鈕：給 Manager 和 Admin */}
                                    {canEdit && (
                                        <Link to={`/missions/edit/${m.id}`} className="btn btn-xs btn-outline-success shadow-sm" style={{ fontSize: '11px', padding: '2px 8px' }} onClick={e => e.stopPropagation()}>編輯</Link>
                                    )}
                                
                                    {/* 刪除按鈕：只給 Admin */}
                                    {canDelete && (
                                        <button className="btn btn-xs btn-outline-danger shadow-sm" style={{ fontSize: '11px', padding: '2px 8px' }} onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}>刪除</button>
                                    )}

                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}