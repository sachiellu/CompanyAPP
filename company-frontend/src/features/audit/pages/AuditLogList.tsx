import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/api';
import type { AuditLog } from '../types';

const HIDDEN_FIELDS = new Set([
    'passwordHash', 'securityStamp', 'concurrencyStamp',
    'normalizedEmail', 'normalizedUserName', 'accessFailedCount',
    'lockoutEnd', 'lockoutEnabled', 'emailConfirmed',
    'phoneNumber', 'phoneNumberConfirmed', 'twoFactorEnabled',
    'userId', 'id',
]);

const ACTION_LABEL: Record<string, string> = {
    Added: '新增',
    Create: '新增',
    Modified: '修改',
    Update: '修改',
    Deleted: '刪除',
    Delete: '刪除',
    DeleteBatch: '批次刪除',
    Import: '匯入',
};

const ENTITY_LABEL: Record<string, string> = {
    Company: '廠商',
    Employee: '員工',
    Mission: '任務',
};

function actorLabel(name?: string) {
    if (!name || name === 'Anonymous' || name === 'System/Anonymous' || name === 'System' || name === '系統') {
        return '系統自動';
    }
    return name;
}

function fieldLabel(key: string) {
    const map: Record<string, string> = {
        name: '名稱',
        email: '信箱',
        title: '標題',
        status: '狀態',
        staffId: '工號',
        position: '職位',
        taxId: '統編',
        industry: '產業',
        category: '類別',
        companyId: '所屬廠商',
    };
    return map[key] || key;
}

function displayValue(value: unknown) {
    if (value === null || value === undefined || value === '') return '（空）';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

function formatChanges(raw?: string) {
    if (!raw) return '沒有可顯示的變更內容';
    const text = raw.trim();
    if (!text.startsWith('{') && !text.startsWith('[')) return text;

    try {
        const data = JSON.parse(text) as {
            Old?: Record<string, unknown>;
            New?: Record<string, unknown>;
            [key: string]: unknown;
        };

        if (data.Old || data.New) {
            const oldValues = data.Old ?? {};
            const newValues = data.New ?? {};
            const keys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
            const lines: string[] = [];
            keys.forEach((key) => {
                if (HIDDEN_FIELDS.has(key)) return;
                const before = oldValues[key];
                const after = newValues[key];
                if (JSON.stringify(before) === JSON.stringify(after)) return;
                lines.push(`${fieldLabel(key)}：${displayValue(before)} → ${displayValue(after)}`);
            });
            return lines.length > 0 ? lines.join('；') : '系統內部更新，沒有業務欄位變動';
        }

        const lines = Object.entries(data)
            .filter(([key]) => !HIDDEN_FIELDS.has(key))
            .map(([key, value]) => `${fieldLabel(key)}：${displayValue(value)}`);
        return lines.length > 0 ? lines.join('；') : '系統內部更新，沒有業務欄位變動';
    } catch {
        return text;
    }
}

function actionClass(action: string) {
    if (action === 'Deleted' || action === 'Delete') return 'bg-danger';
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
            const visible = (res.data || []).filter(log => !log.entityName?.startsWith('Identity'));
            setLogs(visible);
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
                <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                    <thead className="table-light">
                        <tr>
                            <th className="ps-4">時間</th>
                            <th>誰做的</th>
                            <th>來源</th>
                            <th>做了什麼</th>
                            <th>改哪裡</th>
                            <th className="pe-4">改了什麼</th>
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
                                    <td className="small">
                                        {actorLabel(log.userName) === '系統自動' ? '系統自動執行' : '系統內操作'}
                                    </td>
                                    <td>
                                        <span className={`badge ${actionClass(log.action)}`}>
                                            {ACTION_LABEL[log.action] || log.action}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge bg-light text-dark border">
                                            {ENTITY_LABEL[log.entityName] || log.entityName}
                                        </span>
                                    </td>
                                    <td className="text-secondary pe-4">{formatChanges(log.changes)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="text-center py-4 text-muted">暫無操作紀錄</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
}
