import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

export default function CompanyEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    // 定義狀態
    const [name, setName] = useState("");
    const [industry, setIndustry] = useState("");
    const [address, setAddress] = useState("");
    const [taxId, setTaxId] = useState("");
    const [foundedDate, setFoundedDate] = useState("");

    // 檔案物件 (傳給後端)
    const [imageFile, setImageFile] = useState<File | null>(null);
    // 預覽圖片的網址(只給前端看)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5203/api';

    // 抓取舊資料
    useEffect(() => {
        const fetchCompany = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("請先登入");
                navigate('/login');
                return;
            }

            try {
                const res = await fetch(`${baseUrl}/companies/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) throw new Error("讀取資料失敗");

                const data = await res.json();

                setName(data.name);
                setIndustry(data.industry);
                setAddress(data.address);
                setTaxId(data.taxId || "");

                if (data.foundedDate) {
                    setFoundedDate(data.foundedDate.split('T')[0]);
                }

                // 如果原本有圖片，設定為初始預覽圖
                if (data.logoPath) {
                    setPreviewUrl(`${data.logoPath}?t=${Date.now()}`);
                }

            } catch (error) {
                console.error(error);
                alert("無法載入廠商資料");
                navigate('/');
            }
        };

        if (id) fetchCompany();
    }, [id, navigate, baseUrl]);

    //  處理檔案選擇與預覽 (確保檔案馬上能看到)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // 1. 設定要上傳的檔案
            setImageFile(file);

            // 2. 產生預覽圖網址
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    // 送出修改
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        const formData = new FormData();
        formData.append("Name", name);
        formData.append("Industry", industry);
        formData.append("Address", address);
        formData.append("TaxId", taxId);

        if (foundedDate) {
            formData.append("FoundedDate", foundedDate);
        }

        if (imageFile) {
            formData.append("ImageFile", imageFile);
        }

        try {
            const res = await fetch(`${baseUrl}/companies/${id}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) throw new Error("更新失敗");

            alert("修改成功！");
            navigate('/');
        } catch (error) {
            console.error(error);
            alert("修改時發生錯誤");
        }
    };

    return (
        <div className="w-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">編輯廠商資料</h2>
                <Link to="/" className="btn btn-outline-secondary">取消</Link>
            </div>

            <div className="card shadow-sm border-0 w-100">
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>

                        {/* 即時預覽區塊 */}
                        <div className="mb-4 text-center">
                            <label className="form-label fw-bold d-block text-muted">目前 Logo / 預覽</label>
                            <div
                                className="border rounded bg-light d-inline-flex align-items-center justify-content-center overflow-hidden"
                                style={{ width: 500, height: 350, position: 'relative' }}
                            >
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                    />
                                ) : (
                                    <span className="text-muted">尚無圖片</span>
                                )}
                            </div>
                        </div>

                        <div className="row g-3">
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
                                    type="date" // 指定為日期選擇器
                                    className="form-control"
                                    value={foundedDate}
                                    onChange={e => setFoundedDate(e.target.value)}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">地址</label>
                                <input className="form-control" value={address} onChange={e => setAddress(e.target.value)} />
                            </div>

                            {/* 檔案上傳 */}
                            <div className="col-12">
                                <label className="form-label fw-bold">更換 Logo</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept="image/*"
                                    onChange={handleFileChange} // 記得綁定新的 handler
                                />
                                <div className="form-text">選擇新圖片後，上方會即時顯示預覽</div>
                            </div>
                        </div>

                        <div className="mt-4 d-flex justify-content-end gap-2">
                            <Link to="/" className="btn btn-secondary">取消</Link>
                            <button type="submit" className="btn btn-primary px-4">
                                保存修改
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}