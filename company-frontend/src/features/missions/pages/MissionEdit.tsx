import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../../services/api';
import { MissionFormFields } from '../components/MissionFormFields';
import { useEscBack } from '../../../hooks/useEscBack';
import type { Mission, MissionFormData } from '../types';
import type { Company } from '../../companies/types';
import type { Employee } from '../../employees/types';
import { extractErrorMessage } from '../../../utils/errorHandler';

function missionStatusToFormValue(status: Mission['status'] | number | string): string {
    if (typeof status === 'number') {
        return ['Pending', 'Processing', 'Completed'][status] ?? 'Pending';
    }
    const s = String(status);
    if (s === 'Progress') return 'Processing';
    if (s === 'Delayed') return 'Pending';
    return s;
}

function formatDateField(value: string | undefined): string {
    if (!value) return '';
    return value.includes('T') ? value.split('T')[0] : value;
}

export default function MissionEdit() {
    useEscBack('/missions');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<MissionFormData>({
        title: '',  
        description: '',
        createDate: '',
        deadline: '',
        status: 'Pending',
        companyId: '',
        employeeId: ''
    });

    const [companies, setCompanies] = useState<Company[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [missionLoaded, setMissionLoaded] = useState(false);

    // 1. 初始化讀取
    const loadData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setLoadError(null);
        setMissionLoaded(false);
        try {
            const [resComp, resEmp, resMission] = await Promise.all([
                api.get<Company[]>('/companies'),
                api.get<Employee[]>('/employees'),
                api.get<Mission>(`/missions/${id}`)
            ]);

            setCompanies(resComp.data || []);
            setAllEmployees(resEmp.data || []);

            const m = resMission.data;
            setFormData({
                title: m.title,
                description: m.description || "",
                createDate: formatDateField(m.createDate),
                deadline: formatDateField(m.deadline),
                status: missionStatusToFormValue(m.status),
                companyId: m.companyId?.toString() ?? '',
                employeeId: m.employeeId?.toString() ?? '',
            });
            setMissionLoaded(true);
        } catch (err: unknown) {
            setLoadError(extractErrorMessage(err) || '無法載入任務資料');
        } finally { setLoading(false); }
    }, [id]);

    useEffect(() => { loadData(); }, [loadData]);

    // 2. 廠商與員工連動過濾
    useEffect(() => {
        if (formData.companyId) {
            const filtered = allEmployees.filter(emp => Number(emp.companyId) === Number(formData.companyId));
            setFilteredEmployees(filtered);
        } else {
            setFilteredEmployees([]);
        }
    }, [formData.companyId, allEmployees]);

    const handleFieldChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/missions/${id}`, {
                title: formData.title,
                description: formData.description || null,
                deadline: formData.deadline,
                status: formData.status,
                companyId: Number(formData.companyId),
                employeeId: Number(formData.employeeId),
            });
            navigate('/missions');

        } catch (err: unknown) {
            console.error("修改失敗:", err);
            
            const errorMsg = extractErrorMessage(err);
            alert(errorMsg); 
            
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div className="page-container position-relative px-4 pt-3">
            <div className="page-header-wrapper d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>編輯派工任務 {loading && "..."}</h2>
                <Link to="/missions" className="btn btn-sm btn-outline-secondary px-3 shadow-sm">返回列表</Link>
            </div>

            <form onSubmit={handleSubmit} className="card shadow border-0 p-4 mx-auto" style={{ maxWidth: '850px' }}>
                {/* 增加狀態選擇欄位 (僅在編輯模式出現) */}
                <div className="mb-4">
                    <label className="form-label fw-bold text-primary small">任務進度狀態</label>
                    <select className="form-select form-select-sm" value={formData.status} onChange={e => handleFieldChange('status', e.target.value)}>
                        <option value="Pending">待處理</option>
                        <option value="Processing">執行中</option>
                        <option value="Completed">已完工</option>
                    </select>
                </div>

                {loadError && (
                    <div className="alert alert-danger py-2 small">{loadError}</div>
                )}

                <MissionFormFields
                    data={formData}
                    companies={companies}
                    employees={filteredEmployees}
                    onChange={handleFieldChange}
                />

                <div className="d-flex justify-content-end gap-3 mt-5 pt-3 border-top">
                    <button type="submit" className="btn btn-sm btn-primary px-5 py-2 fw-bold shadow-sm" disabled={loading || !missionLoaded}>
                        儲存任務變更
                    </button>
                </div>
            </form>
        </div>
    );
}