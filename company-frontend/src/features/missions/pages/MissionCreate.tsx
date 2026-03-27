import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { MissionFormFields } from '../components/MissionFormFields';
import { useEscBack } from '../../../hooks/useEscBack';
import type { Company } from '../../companies/types'; // 補上型別引入
import type { Employee } from '../../employees/types'; // 補上型別引入

export default function MissionCreate() {
    useEscBack('/missions');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // 修正：使用箭頭函式初始化，避免 Date.now() 報錯
    const [formData, setFormData] = useState(() => ({
        title: '',
        description: '',
        createDate: new Date().toISOString().split('T')[0],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Pending',
        companyId: '',
        employeeId: ''
    }));

    // 修正：加上型別定義 <Company[]> 與 <Employee[]>，解決 never[] 報錯
    const [companies, setCompanies] = useState<Company[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

    useEffect(() => {
        Promise.all([
            api.get<Company[]>('/companies'),
            api.get<Employee[]>('/employees')
        ]).then(([resComp, resEmp]) => {
            if (resComp.data) setCompanies(resComp.data || []);
            if (resEmp.data) setAllEmployees(resEmp.data || []);
        });
    }, []);

    useEffect(() => {
        if (formData.companyId) {
            const filtered = allEmployees.filter(emp => {
                return Number(emp.companyId) === Number(formData.companyId);
            });
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
            const res = await api.post('/missions', formData);
            if (res.data) navigate('/missions');
        } finally { setLoading(false); }
    };

    return (
        <div className="page-container position-relative px-4 pt-3">
            <div className="page-header-wrapper d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>新增派工任務 {loading && "..."}</h2>
                <Link to="/missions" className="btn btn-sm btn-outline-secondary px-3 shadow-sm">返回列表</Link>
            </div>

            <form onSubmit={handleSubmit} className="card shadow border-0 p-4 mx-auto" style={{ maxWidth: '850px' }}>
                <MissionFormFields data={formData} companies={companies} employees={filteredEmployees} onChange={handleFieldChange} />
                <div className="d-flex justify-content-end gap-3 mt-5 pt-3 border-top">
                    <button type="submit" className="btn btn-sm btn-primary px-5 py-2 fw-bold shadow-sm" disabled={loading}>確認派工並儲存</button>
                </div>
            </form>
        </div>
    );
}