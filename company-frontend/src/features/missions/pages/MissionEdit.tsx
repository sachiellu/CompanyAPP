import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../../services/api';
import { MissionFormFields } from '../components/MissionFormFields';
import { useEscBack } from '../../../hooks/useEscBack';
import type { Mission, MissionFormData } from '../types';
import type { Company } from '../../companies/types';
import type { Employee } from '../../employees/types';

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

    // 1. 初始化讀取
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [resComp, resEmp, resMission] = await Promise.all([
                api.get<Company[]>('/companies'),
                api.get<Employee[]>('/employees'),
                api.get<Mission>(`/missions/${id}`)
            ]);

            if (resComp.ok) setCompanies(resComp.data || []);
            if (resEmp.ok) setAllEmployees(resEmp.data || []);

            if (resMission.ok && resMission.data) {
                const m = resMission.data;
                setFormData({
                    title: m.title,
                    description: m.description || "",
                    createDate: m.createDate.split('T')[0],
                    deadline: m.deadline.split('T')[0],
                    status: m.status,
                    companyId: m.companyId.toString(),
                    employeeId: m.employeeId.toString()
                });
            }
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
            const res = await api.put(`/missions/${id}`, formData);
            if (res.ok) navigate('/missions');
            else alert("修改失敗");
        } finally { setLoading(false); }
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
                        <option value="Progress">執行中</option>
                        <option value="Completed">已完工</option>
                        <option value="Delayed">已延遲</option>
                    </select>
                </div>

                <MissionFormFields
                    data={formData}
                    companies={companies}
                    employees={filteredEmployees}
                    onChange={handleFieldChange}
                />

                <div className="d-flex justify-content-end gap-3 mt-5 pt-3 border-top">
                    <button type="submit" className="btn btn-sm btn-primary px-5 py-2 fw-bold shadow-sm" disabled={loading}>
                        儲存任務變更
                    </button>
                </div>
            </form>
        </div>
    );
}