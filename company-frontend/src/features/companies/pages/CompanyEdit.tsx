import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/api';
// 修正：引入正確型別，避免 any
import type { Company, Contact } from '../types';
import { CompanyFormFields } from '../components/CompanyFormFields';
import { useEscBack } from '../../../hooks/useEscBack';
import { extractErrorMessage } from '../../../utils/errorHandler';

export default function CompanyEdit() {
    useEscBack('/companies');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // 廠商基礎狀態
    const [name, setName] = useState("");
    const [taxId, setTaxId] = useState("");
    const [industry, setIndustry] = useState("");
    const [address, setAddress] = useState("");
    const [foundedDate, setFoundedDate] = useState("");
    const [existingLogo, setExistingLogo] = useState("");

    // 聯絡人狀態
    const [contacts, setContacts] = useState<Contact[]>([]);

    const fetchDetail = useCallback(async (compId: string) => {
        setLoading(true);
        try {
            const res = await api.get<Company>(`/companies/${compId}`);
            const d = res.data;

            // 基礎欄位設定
            setName(d.name || "");
            setTaxId(d.taxId || "");
            setIndustry(d.industry || "");
            setAddress(d.address || "");
            setExistingLogo(d.logoPath || "");
            setContacts(d.contacts || []); 

            // 修正 Date 報錯：先取值，確認是字串再 split
            const rawDate = d.foundedDate;
            if (typeof rawDate === 'string') {
                setFoundedDate(rawDate.split('T')[0]);
            }
        } catch (err) {
            console.error("載入詳情失敗:", err);
        } finally { 
            setLoading(false); 
        }
    }, []);

    useEffect(() => { if (id) fetchDetail(id); }, [id, fetchDetail]);

    // 處理聯絡人變動
    const handleContactChange = (index: number, field: keyof Contact, value: string) => {
        const newList = [...contacts];
        newList[index] = { ...newList[index], [field]: value };
        setContacts(newList);
    };

    const addContact = () => {
        setContacts([...contacts, { id: 0, name: '', phone: '', email: '', remark: '' }]);
    };

    const removeContact = (index: number) => {
        setContacts(contacts.filter((_, i) => i !== index));
    };

    const handleFieldChange = (key: string, value: string) => {
        if (key === 'name') setName(value);
        else if (key === 'taxId') setTaxId(value);
        else if (key === 'industry') setIndustry(value);
        else if (key === 'address') setAddress(value);
        else if (key === 'foundedDate') setFoundedDate(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // 不再使用 FormData，直接傳物件
        const payload = {
            id: id,
            name: name,
            taxId: taxId,
            industry: industry,
            address: address,
            foundedDate: foundedDate,
            logoPath: existingLogo, // 這裡已經是上傳完後的 Cloudinary 網址了
            contacts: contacts 
        };

        try {
            await api.post(`/companies/${id}`, payload); // 後端接收 [FromBody]
            alert("修改成功！");
            navigate('/companies');
        } catch (err) {
            alert(extractErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container position-relative px-4 pt-3">
            <div className="page-header-wrapper d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>編輯廠商資料</h2>
                <Link to="/companies" className="btn btn-sm btn-outline-secondary px-3 shadow-sm">返回列表</Link>
            </div>

            <form onSubmit={handleSubmit} className="card shadow border-0 p-4 mx-auto text-start" style={{ maxWidth: '900px' }}>
                {/* Logo 區塊 */}
                <div className="text-center mb-4 pb-4 border-bottom">
                    <div className="d-inline-block border bg-light shadow-sm mb-3 p-1">
                        <div className="bg-white d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '200px', height: '200px' }}>
                            {/* 上傳中顯示轉圈圈 */}
                            {loading && (
                                <div className="position-absolute top-50 start-50 translate-middle" style={{ zIndex: 1 }}>
                                    <div className="spinner-border spinner-border-sm text-primary"></div>
                                </div>
                            )}
                            
                            {existingLogo ? (
                                <img 
                                    src={existingLogo} 
                                    className={`w-100 h-100 object-fit-contain ${loading ? 'opacity-25' : ''}`} 
                                    alt="logo" 
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            ) : (
                                <span className="text-muted small">尚未上傳 Logo</span>
                            )}
                        </div>
                    </div>
                    <div className="mx-auto" style={{ maxWidth: '350px' }}>
                        <input type="file" className="form-control form-control-sm" 
                        onChange={async(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                setLoading(true); // 開始轉圈圈（圖片上傳中）
                                try {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    
                                    // 呼叫一個獨立的上傳 API (你需要先在 Controller 寫好這個 Endpoint)
                                    const res = await api.post('/companies/upload-logo', formData); 
                                    
                                    // 拿到 Cloudinary 回傳的網址
                                    const newImageUrl = res.data.url; 
                                    
                                    setExistingLogo(newImageUrl); // 更新預覽圖
                                    // 這樣 handleSubmit 時，existingLogo 就已經是網址了
                                } catch (err) {
                                    console.error(err);
                                    alert("圖片上傳失敗");
                                } finally {
                                    setLoading(false);
                                }
                            }
                        }} />
                    </div>
                </div>

                {/* 廠商基礎欄位 */}
                <div className="mb-5">
                    <CompanyFormFields data={{ name, taxId, industry, address, foundedDate }} onChange={handleFieldChange} />
                </div>

                {/* --- 聯絡人編輯區 --- */}
                <div className="border-top pt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold text-primary m-0">行政聯絡人管理</h6>
                        <button type="button" className="btn btn-xs btn-primary px-3" onClick={addContact}>+ 新增聯絡人</button>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-sm border small">
                            <thead className="table-light">
                                <tr><th>姓名</th><th>電話</th><th>Email</th><th>備註</th><th style={{ width: '50px' }}></th></tr>
                            </thead>
                            <tbody>
                                {contacts.map((c, index) => (
                                    <tr key={index}>
                                        <td><input className="form-control form-control-sm border-0" value={c.name} onChange={e => handleContactChange(index, 'name', e.target.value)} placeholder="必填" required /></td>
                                        <td><input className="form-control form-control-sm border-0" value={c.phone} onChange={e => handleContactChange(index, 'phone', e.target.value)} /></td>
                                        <td><input className="form-control form-control-sm border-0" value={c.email} onChange={e => handleContactChange(index, 'email', e.target.value)} /></td>
                                        <td><input className="form-control form-control-sm border-0" value={c.remark} onChange={e => handleContactChange(index, 'remark', e.target.value)} /></td>
                                        <td><button type="button" className="btn text-danger btn-sm" onClick={() => removeContact(index)}><i className="bi bi-trash"></i></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="d-flex justify-content-end gap-3 mt-5 pt-3 border-top">
                    <button type="submit" className="btn btn-sm btn-primary px-5 py-2 fw-bold shadow-sm" disabled={loading}>儲存所有修改</button>
                </div>
            </form>
        </div>
    );
}