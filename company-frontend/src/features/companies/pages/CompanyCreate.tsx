import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { CompanyFormFields } from '../components/CompanyFormFields';
import { useEscBack } from '../../../hooks/useEscBack';
import { extractErrorMessage } from '../../../utils/errorHandler';

export default function CompanyCreate() {
    useEscBack('/companies');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [taxId, setTaxId] = useState('');
    const [industry, setIndustry] = useState('');
    const [address, setAddress] = useState('');
    const [foundedDate, setFoundedDate] = useState(() => {
    const date = new Date();
        date.setFullYear(date.getFullYear() - 5);
        return date.toISOString().split('T')[0];
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        // 這是一個「清潔工」函數
        // 當這個組件被銷毀（例如用戶跳轉頁面）時，會執行 return 裡面的代碼
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                console.log("清理了預覽圖記憶體");
            }
        };
    }, [previewUrl]); // 當 previewUrl 改變時，會先執行上一次的清理

    // 修正點：明確指定型別，避免 any 報錯
    const handleFieldChange = (key: string, value: string) => {
        if (key === 'name') setName(value);
        else if (key === 'taxId') setTaxId(value);
        else if (key === 'industry') setIndustry(value);
        else if (key === 'address') setAddress(value);
        else if (key === 'foundedDate') setFoundedDate(value);
    };

    // 新增：處理檔案選取函式，確保 logic 完整
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // 如果原本已經有預覽圖，先釋放舊的
            if (previewUrl) URL.revokeObjectURL(previewUrl);

            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 🚨 關鍵：必須使用 FormData 才能對應後端的 [FromForm]
    const formData = new FormData();
    formData.append('name', name);       // 👈 這裡用小寫，對應後端的 Name="name"
    formData.append('industry', industry);
    formData.append('address', address);
    formData.append('taxId', taxId);
    formData.append('foundedDate', foundedDate);
    
    // 如果有選圖片
    if (selectedFile) {
        formData.append('imageFile', selectedFile);
    }

    try {
        await api.post('/companies', formData);
        alert("建立成功！"); 
        navigate('/companies');
        
    } catch (err) {
        console.error("建立失敗:", err);

        const errorMsg = extractErrorMessage(err);
        alert(errorMsg); 
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="page-container position-relative px-4 pt-3">
            {/* Header 區：對齊 List 頁面，使用 btn-sm 與 px-3 */}
            <div className="page-header-wrapper d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-dark fw-bold mb-0" style={{ fontSize: '1.25rem' }}>
                    新增廠商資料 {loading && "..."}
                </h2>
                <Link to="/" className="btn btn-sm btn-outline-secondary px-3 shadow-sm text-nowrap">
                    返回列表
                </Link>
            </div>

            {/* 內容卡片：p-4 縮減內距，防止 100% 下過大 */}
            <form onSubmit={handleSubmit} className="card shadow border-0 p-4 mx-auto" style={{ maxWidth: '850px' }}>

                {/* 表單欄位：CompanyFormFields 內部已配合縮減 */}
                <div className="mb-4">
                    <CompanyFormFields data={{ name, taxId, industry, address, foundedDate }} onChange={handleFieldChange} />
                </div>

                {/* 圖片上傳：尺寸縮減至 200px */}
                <div className="border-top pt-4">
                    <label className="fw-bold mb-2 d-block text-muted small text-uppercase" style={{ fontSize: '11px' }}>公司 Logo 上傳</label>
                    <div className="d-flex align-items-start gap-4">
                        <div className="p-1 bg-white border shadow-sm flex-shrink-0">
                            <div className="bg-light d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '200px', height: '200px' }}>
                                {previewUrl ? (
                                    <img src={previewUrl} className="w-100 h-100 object-fit-contain" alt="preview" />
                                ) : (
                                    <div className="text-muted small text-center">
                                        <i className="bi bi-image d-block fs-2 mb-1"></i>尚未選擇
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex-grow-1">
                            {/* 使用標準大小 input */}
                            <input type="file" className="form-control form-control-sm mb-3 shadow-sm" accept="image/*" onChange={handleFileChange} />
                            <div className="p-3 bg-light rounded border small text-muted" style={{ fontSize: '12px' }}>
                                <h6 className="fw-bold mb-2 text-dark small">上傳須知：</h6>
                                <ul className="mb-0 ps-3">
                                    <li>支援格式：JPG, PNG, WEBP</li>
                                    <li>建議比例：1:1 正方形</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 底部按鈕：使用 btn-sm */}
                <div className="d-flex justify-content-end gap-3 mt-5 pt-3 border-top">
                    <button type="submit" className="btn btn-sm btn-primary px-5 py-2 fw-bold shadow-sm" disabled={loading}>
                        確認新增並儲存
                    </button>
                </div>
            </form>
        </div>
    );
}