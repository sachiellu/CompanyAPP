import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/api';
import { useEscBack } from '../../../hooks/useEscBack';
import type { Mission } from '../types';

export default function MissionDetail() {
    useEscBack('/missions');
    const { id } = useParams<{ id: string }>();
    const [mission, setMission] = useState<Mission | null>(null);
    const [loading, setLoading] = useState(false); // 修正：現在會用到它

    // 權限邏輯
    const userRole = localStorage.getItem('userRole') || 'User';
    const isAdmin = userRole === 'Admin';
    const isManager = userRole === 'Manager';

    // 任務的權限操作能力
    const canEdit = isAdmin || isManager; // 新增、編輯任務 (Manager 可以派工)

    const fetchDetail = useCallback(async (mid: string) => {
        setLoading(true);
        try {
            const res = await api.get<Mission>(`/missions/${mid}`);
            if (res.status === 200)     
                setMission(res.data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (id) fetchDetail(id);
    }, [id, fetchDetail]);

    if (loading && !mission) return <div className="page-container p-5 text-center text-muted">載入中...</div>;

    return (
        <div className="page-container position-relative px-4 pt-3">
            {/* Header：對齊 List 頁面 */}
            <div className="page-header-wrapper d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>
                    任務詳細資料 {loading && "..."}
                </h2>
                <div className="d-flex gap-2">
                    {canEdit && (
                        <Link to={`/missions/edit/${id}`} className="btn btn-sm btn-primary px-3 shadow-sm">編輯任務</Link>
                    )}
                    <Link to="/missions" className="btn btn-sm btn-outline-secondary px-3 shadow-sm">返回列表</Link>
                </div>
            </div>

            {mission && (
                <div className="card shadow-sm border-0 rounded overflow-hidden mx-auto" style={{ maxWidth: '900px' }}>
                    <div className="card-header bg-light py-2 px-4 border-bottom">
                        <span className="text-secondary fw-bold small text-uppercase">任務內容</span>
                    </div>
                    <div className="card-body p-4 text-start">
                        <div className="row g-4">
                            <div className="col-12 border-bottom pb-3 mb-2">
                                <label className="text-muted small d-block mb-1 fw-bold">任務主題</label>
                                <h4 className="fw-bold text-dark m-0">{mission.title}</h4>
                            </div>
                            <div className="col-md-6">
                                <label className="text-muted small d-block mb-1 fw-bold">指派對象</label>
                                <div className="fw-bold"><i className="bi bi-person-badge me-2 text-primary"></i>{mission.employeeName}</div>
                                <span className="badge bg-light text-dark border mt-2 fw-normal" style={{ fontSize: '12px' }}>{mission.companyName}</span>
                            </div>
                            <div className="col-md-6">
                                <label className="text-muted small d-block mb-1 fw-bold">截止日期</label>
                                <div className="text-danger fw-bold"><i className="bi bi-calendar-x me-2"></i>{mission.deadline.split('T')[0]}</div>
                            </div>
                            <div className="col-12 bg-light p-3 rounded border">
                                <label className="fw-bold text-secondary small mb-2 text-uppercase">詳細描述</label>
                                <p className="mb-0 small" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{mission.description || "無詳細描述"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}