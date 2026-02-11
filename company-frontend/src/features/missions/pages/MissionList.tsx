    import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';
import type { Mission } from '../types';

export default function MissionList() {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchMissions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<Mission[]>('/missions');
            if (res.ok) setMissions(res.data || []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMissions(); }, [fetchMissions]);

    const statusMap: Record<string, { label: string; class: string }> = {
        'Pending': { label: '待處理', class: 'bg-secondary' },
        'Progress': { label: '執行中', class: 'bg-primary' },
        'Completed': { label: '已完工', class: 'bg-success' },
        'Delayed': { label: '已延遲', class: 'bg-danger' }
    };

    return (
        <div className="page-container position-relative px-4 pt-3">
            <div className="page-header-wrapper d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>
                    任務派工管理 {loading && <span className="spinner-border spinner-border-sm ms-2 text-primary"></span>}
                </h2>
                {/* 新增按鈕對齊：px-3 */}
                <Link to="/missions/create" className="btn btn-sm btn-primary px-3 shadow-sm text-nowrap">
                    <i className="bi bi-plus-circle me-1"></i>發布新任務
                </Link>
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
                                <td>{m.employeeName}</td>
                                <td><span className="badge bg-light text-dark border fw-normal" style={{ fontSize: '12px' }}>{m.companyName}</span></td>
                                <td className="text-muted small">{m.deadline.split('T')[0]}</td>
                                <td>
                                    <span className={`badge ${statusMap[m.status]?.class || 'bg-secondary'} px-2 py-1`} style={{ fontSize: '11px' }}>
                                        {statusMap[m.status]?.label || m.status}
                                    </span>
                                </td>
                                <td className="text-end px-4">
                                    <Link to={`/missions/${m.id}`} className="btn btn-xs btn-outline-primary" style={{ fontSize: '11px', padding: '2px 8px' }}>詳情</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}