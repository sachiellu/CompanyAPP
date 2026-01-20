import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function EmployeeImport() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5203/api';

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) { alert("請選擇檔案"); return; }

        const token = localStorage.getItem('token');
        if (!token) { alert("請先登入"); navigate('/login'); return; }

        const formData = new FormData();
        formData.append("excelFile", file); // 對應後端參數名稱

        try {
            setUploading(true);
            const res = await fetch(`${baseUrl}/employees/import`, { // 這裡需要後端有對應的 API
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                alert("匯入成功！");
                navigate('/employees');
            } else {
                const errText = await res.text();
                alert(`匯入失敗：${errText}`);
            }
        } catch (error) {
            console.error(error);
            alert("發生錯誤");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container mt-4" style={{ maxWidth: '600px' }}>
            <div className="card shadow-sm">
                <div className="card-header bg-success text-white">
                    <h4 className="mb-0">批次匯入員工</h4>
                </div>
                <div className="card-body p-4">
                    <div className="alert alert-info">
                        <strong>注意：</strong> 請上傳 .xlsx 檔案，第一列必須為標題列。
                        <br />
                        欄位順序：姓名 | 職位 | Email | 所屬公司名稱
                    </div>

                    <form onSubmit={handleImport}>
                        <div className="mb-4">
                            <label className="form-label fw-bold">選擇 Excel 檔案</label>
                            <input
                                type="file"
                                className="form-control"
                                accept=".xlsx"
                                onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                                required
                            />
                        </div>

                        <div className="d-grid gap-2">
                            <button type="submit" className="btn btn-success" disabled={uploading}>
                                {uploading ? "上傳中..." : "開始匯入"}
                            </button>
                            <Link to="/employees" className="btn btn-secondary">取消返回</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}