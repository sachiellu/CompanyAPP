import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/api';
import type { AuditLog } from '../types';

export default function AuditLogList() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<AuditLog[]>('/audit-logs');
            setLogs(res.data || []);
        } catch (err) {
            console.error("讀取日誌失敗", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    return (
        <div className="page-container px-4 pt-3 text-start">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>
                    系統操作日誌 {loading && <span className="spinner-border spinner-border-sm ms-2"></span>}
                </h2>
                <button className="btn btn-sm btn-outline-secondary" onClick={fetchLogs} disabled={loading}>
                    重新整理
                </button>
            </div>

            <div className="bg-white shadow-sm rounded overflow-hidden">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                    <thead className="table-light">
                        <tr>
                            <th className="ps-4">時間</th>
                            <th>執行者</th>
                            <th>動作</th>
                            <th>對象</th>
                            <th className="pe-4">詳細變更</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length > 0 ? (
                            logs.map(log => (
                                <tr key={log.id}>
                                    <td className="ps-4 text-muted small">
                                        {new Date(log.timestamp).toLocaleString('zh-TW')}
                                    </td>
                                    <td className="fw-bold">{log.userName || 'System'}</td>
                                    <td>
                                        <span className={`badge ${log.action.includes('Delete') ? 'bg-danger' : 'bg-primary'}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td><span className="badge bg-light text-dark border">{log.entityName}</span></td>
                                    <td className="text-secondary pe-4">{log.changes}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center py-4 text-muted">暫無操作紀錄</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}