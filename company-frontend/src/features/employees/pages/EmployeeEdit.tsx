import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/api';
import { type Employee, EmployeeStatus } from '../types';
import type { Company } from '../../companies/types';
import { useEscBack } from '../../../hooks/useEscBack';
import { EmployeeFormFields } from '../components/EmployeeFormFields';

export default function EmployeeEdit() {
    useEscBack('/employees');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const userRole = localStorage.getItem('userRole');
    const isAdmin = userRole === 'Admin'; // 判斷是否為管理員


    const [formData, setFormData] = useState({
        staffId: "",
        name: "",
        position: "",
        email: "",
        companyId: "",
        status: "" as EmployeeStatus | string // 為了判斷 readOnly
    });
    const [companies, setCompanies] = useState<Company[]>([]);

    const loadInitialData = useCallback(async (employeeId: string) => {
        setLoading(true);
        try {
            const [resComp, resEmp] = await Promise.all([
                api.get<Company[]>('/companies'),
                api.get<Employee>(`/employees/${employeeId}`)
            ]);
            if (resComp.ok) setCompanies(resComp.data);
            if (resEmp.ok) {
                const emp = resEmp.data;
                setFormData({
                    staffId: emp.staffId || "",
                    name: emp.name || "",
                    position: emp.position || "",
                    email: emp.email || "",
                    companyId: emp.companyId?.toString() || "",
                    status: emp.status
                });
            }
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (id) loadInitialData(id);
    }, [id, loadInitialData]);

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // 4. 使用 formData 建立 payload
        const payload = {
            ...formData,
            companyId: Number(formData.companyId)
        };
        try {
            const res = await api.put(`/employees/${id}`, payload);
            if (res.ok) navigate('/employees');
        } finally { setLoading(false); }
    };

    return (
        <div className="page-container position-relative px-4 pt-3">
            <div className="page-header-wrapper d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>編輯員工資料 {loading && "..."}</h2>
                <Link to="/employees" className="btn btn-sm btn-outline-secondary px-3 shadow-sm text-nowrap">返回列表</Link>
            </div>

            <form onSubmit={handleSubmit} className="card shadow border-0 p-4 mx-auto text-start" style={{ maxWidth: '850px' }}>

                {/* 5. 呼叫元件，取代掉原本的一堆 HTML */}
                {/* 記得加上 isEdit={true}，這樣 Email 鎖定邏輯才會生效 */}
                <EmployeeFormFields
                    data={formData}
                    companies={companies}
                    onChange={handleChange}
                    isEdit={true}
                    canEditStaffId={isAdmin} 
                />

                <div className="d-flex justify-content-end mt-5 pt-3 border-top">
                    <button type="submit" className="btn btn-sm btn-primary px-5 py-2 fw-bold shadow-sm" disabled={loading}>
                        儲存變更內容
                    </button>
                </div>
            </form>
        </div>
    );
}