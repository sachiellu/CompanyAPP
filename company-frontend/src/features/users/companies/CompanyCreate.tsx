import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function CompanyCreate() {
    const [name, setName] = useState('');
    const [taxId, setTaxId] = useState('');
    const [industry, setIndustry] = useState('');
    const [address, setAddress] = useState('');

    const [imageFile, setImageFile] = useState<File | null>(null);

    const [foundedDate, setFoundedDate] = useState(() => {
        const date = new Date();
        date.setFullYear(date.getFullYear() - 5); // 減去 5 年
        return date.toISOString().split('T')[0]; // 轉成 YYYY-MM-DD 格式
    });

    const navigate = useNavigate();
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5203/api';

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            alert("請先登入");
            navigate('/login');
            return;
        }

        // 2. 改用 FormData 打包資料 (為了配合後端的 [FromForm])
        const formData = new FormData();
        formData.append("Name", name);
        formData.append("Industry", industry);
        formData.append("Address", address);
        formData.append("TaxId", taxId);

        formData.append("FoundedDate", foundedDate);

        // 如果有選圖片才放進去
        if (imageFile) {
            formData.append("ImageFile", imageFile);
        }

        const apiUrl = `${baseUrl}/companies`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData, // 傳送 formData
            });

            if (!response.ok) {
                if (response.status === 401) {
                    alert("登入過期");
                    navigate('/login');
                    return;
                }
                throw new Error("新增失敗");
            }

            alert("新增成功！");
            navigate('/');
        } catch (error) {
            console.error(error);
            alert("發生錯誤");
        }
    };

    return (
        <div className="w-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">新增廠商</h2>
                <Link to="/" className="btn btn-outline-secondary">返回列表</Link>
            </div>

            <div className="card shadow-sm border-0 w-100">
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit} className="row g-4">

                        <div className="col-md-6">
                            <label className="form-label fw-bold">廠商名稱</label>
                            <input className="form-control" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-bold">統一編號</label>
                            <input className="form-control" value={taxId} onChange={e => setTaxId(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-bold">產業類別</label>
                            <input className="form-control" value={industry} onChange={e => setIndustry(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-bold">成立日期</label>
                            <input
                                type="date"
                                className="form-control"
                                value={foundedDate}
                                onChange={e => setFoundedDate(e.target.value)}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-bold">地址</label>
                            <input className="form-control" value={address} onChange={e => setAddress(e.target.value)} />
                        </div>

                        {/* 3. 補上圖片上傳欄位 */}
                        <div className="col-12">
                            <label className="form-label fw-bold">公司 Logo</label>
                            <input
                                type="file"
                                className="form-control"
                                accept="image/*"
                                onChange={e => {
                                    if (e.target.files && e.target.files[0]) {
                                        setImageFile(e.target.files[0]);
                                    }
                                }}
                            />
                        </div>

                        <div className="col-12 d-flex justify-content-end gap-2">
                            <Link to="/" className="btn btn-secondary">取消</Link>
                            <button type="submit" className="btn btn-primary px-4">確認新增</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}