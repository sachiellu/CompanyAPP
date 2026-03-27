import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../../services/api';
import type { Company } from '../../companies/types';
import { useEscBack } from '../../../hooks/useEscBack';
import { EmployeeFormFields } from '../components/EmployeeFormFields';
import { extractErrorMessage } from '../../../utils/errorHandler';


export default function EmployeeCreate() {
    useEscBack('/employees');
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        staffId: '',
        name: '',
        position: '',
        email: '',
        companyId: ''
    });

    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get<Company[]>('/companies')
           .then(res => {
               setCompanies(res.data || []); // 加上 || [] 是一種防呆好習慣
           })
           .catch(err => {
               console.error("載入廠商清單失敗", err); // 養成用 axios 順手加 catch 的習慣
           });
    }, []);

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { 
                ...formData, 
                companyId: Number(formData.companyId) 
            };
            
            // Axios 只要能過這行，就是成功
            await api.post('/employees', payload); 
            alert("員工建立成功！");
            navigate('/employees');

        } catch (err: unknown) {
            console.error("建立失敗:", err);
            
            const errorMsg = extractErrorMessage(err);
            alert(errorMsg); 
            
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div className="page-container position-relative px-4 pt-3">
            <div className="page-header-wrapper d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>新增員工資料</h2>
                <Link to="/employees" className="btn btn-sm btn-outline-secondary px-3 shadow-sm">返回列表</Link>
            </div>

            <form onSubmit={handleSubmit} className="card shadow border-0 p-4 mx-auto text-start" style={{ maxWidth: '850px' }}>

                {/* 把原本手刻的一堆 <input> 刪掉，換成呼叫元件！ */}
                <EmployeeFormFields
                    data={formData}
                    companies={companies}
                    onChange={handleChange}
                    isEdit={false} // 這是新增頁面，所以 isEdit 是 false
                />

                <div className="d-flex justify-content-end mt-5 pt-3 border-top">
                    <button type="submit" className="btn btn-sm btn-primary px-5 py-2 fw-bold shadow-sm" disabled={loading}>
                        確認建立員工
                    </button>
                </div>
            </form>
        </div>
    );
}