import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/api';
import type { AuditLog } from '../types';

const ACTION_LABEL: Record<string, string> = {
    Added: 'Create',
    Create: 'Create',
    Modified: 'Update',
    Update: 'Update',
    Deleted: 'Delete',
    Delete: 'Delete',
    DeleteBatch: 'Batch delete',
    Import: 'Import',
};

function isSystemActor(name?: string) {
    if (!name) return true;
    return [
        'Anonymous',
        'System/Anonymous',
        'System',
        '系統',
        '系統自動',
    ].includes(name);
}

function actorLabel(name?: string) {
    return isSystemActor(name) ? 'System' : name;
}

function originLabel(name?: string) {
    return isSystemActor(name) ? 'System' : 'Application';
}

function actionClass(action: string) {
    if (action === 'Deleted' || action === 'Delete' || action === 'DeleteBatch') return 'bg-danger';
    if (action === 'Modified' || action === 'Update') return 'bg-warning text-dark';
    if (action === 'Added' || action === 'Create' || action === 'Import') return 'bg-success';
    return 'bg-primary';
}

export default function AuditLogList() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<AuditLog[]>('/audit-logs');
            const visible = (res.data || []).filter(log =>
                !log.entityName?.startsWith('Identity')
                && !(log.changes || '').trim().startsWith('{')
            );
            setLogs(visible);
        } catch (err) {
            console.error('Failed to load audit logs', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    return (
        <div className="page-container px-4 pt-3 text-start">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>
                    Audit log {loading && <span className="spinner-border spinner-border-sm ms-2"></span>}
                </h2>
                <button className="btn btn-sm btn-outline-secondary" onClick={fetchLogs} disabled={loading}>
                    Refresh
                </button>
            </div>

            <div className="bg-white shadow-sm rounded overflow-hidden">
                <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                    <thead className="table-light">
                        <tr>
                            <th className="ps-4">Timestamp</th>
                            <th>Actor</th>
                            <th>Origin</th>
                            <th>Action</th>
                            <th>Resource</th>
                            <th className="pe-4">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length > 0 ? (
                            logs.map(log => (
                                <tr key={log.id}>
                                    <td className="ps-4 text-muted small">
                                        {new Date(log.timestamp).toLocaleString('zh-TW')}
                                    </td>
                                    <td className="fw-bold">{actorLabel(log.userName)}</td>
                                    <td className="small text-muted">{originLabel(log.userName)}</td>
                                    <td>
                                        <span className={`badge ${actionClass(log.action)}`}>
                                            {ACTION_LABEL[log.action] || log.action}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge bg-light text-dark border">
                                            {log.entityName}
                                        </span>
                                    </td>
                                    <td className="text-secondary pe-4">{log.changes || '—'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="text-center py-4 text-muted">No audit records</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
}
