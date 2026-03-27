import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react'; // 1. 引入 useCallback

interface Company {
    id: number;
    name: string;
    industry: string;
    address: string;
    foundedDate: string;
    logoPath?: string;
}

export default function CompanyList() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const navigate = useNavigate();

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5203';
    const apiUrl = `${baseUrl}/companies`;

    // 2. 用 useCallback 包住 fetchData
    const fetchData = useCallback(async (searchString = "") => {
        const token = localStorage.getItem('token');
        try {
            setLoading(true);
            const url = searchString
                ? `${apiUrl}?searchString=${encodeURIComponent(searchString)}`
                : apiUrl;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) {
                alert("登入已過期，請重新登入");
                navigate('/login');
                return;
            }

            if (!res.ok) throw new Error(`API 請求失敗: ${res.status}`);
            const data = await res.json();
            setCompanies(data);
        } catch (err) {
            console.error(err);
            if (err instanceof Error) setError(err.message);
            else setError("發生未知錯誤");
        } finally {
            setLoading(false);
        }
    }, [apiUrl, navigate]); // 依賴項：當 apiUrl 或 navigate 變動時，fetchData 才會重新定義

    // 3. useEffect 現在可以安全地呼叫 fetchData
    useEffect(() => {

        // 設定防抖動計時器
        const delaySearch = setTimeout(() => {
            fetchData(searchTerm);
        }, 500); // 延遲 0.5 秒發送請求

        // 清除計時器 (當使用者在 0.5 秒內又打字時)
        return () => clearTimeout(delaySearch);

    }, [searchTerm, fetchData]); // 當 searchTerm 改變時，就會觸發這個 useEffect

    // 按下搜尋按鈕時立即觸發 (不用等 0.5 秒)
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData(searchTerm);
    };


    const handleDelete = async (id: number) => {
        if (!confirm("確定要刪除嗎？")) return;
        const token = localStorage.getItem('token');
        if (!token) { alert("請先登入"); navigate('/login'); return; }

        try {
            const response = await fetch(`${apiUrl}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401) { alert("登入過期"); navigate('/login'); return; }
            if (!response.ok) throw new Error("刪除失敗");
            setCompanies(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            alert("刪除錯誤");
            console.error(error);
        }
    };


    // ... (return JSX 保持不變)(Render)
    return (
        <div className="w-100 px-4">
            <header className="mb-4">
                {/* 標題與按鈕區塊：手機版自動換行 */}
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                    <h2 className="mb-0 text-dark me-2">廠商資料列表</h2>
                    <Link to="/companies/create" className="btn btn-primary shadow-sm text-nowrap">
                        + 新增廠商
                    </Link>
                </div>

                {/* 搜尋框區塊 */}
                <div className="row">
                    {/* col-12: 手機全寬, col-md-8: 平板佔8格, col-lg-6: 電腦佔一半 */}
                    <div className="col-12 col-md-8 col-lg-6">
                        <form onSubmit={handleSearch} className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="請輸入廠商名稱..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button className="btn btn-outline-dark" type="submit">
                                 搜尋
                            </button>
                            <button
                                className="btn btn-outline-dark"
                                type="button"
                                onClick={() => {
                                    setSearchTerm("");
                                    fetchData("");
                                }}
                            >
                                清除
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            {loading && <div className="alert alert-info">資料讀取中...</div>}
            {error && <div className="alert alert-danger">❌ 發生錯誤：{error}</div>}

            <div className="row g-4 mx-0">
                {companies.map(company => (
                    <div key={company.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                        <div className="card h-100 shadow-sm border-0">
                            <div className="card-body">
                                <div className="d-flex align-items-center mb-3">
                                    <div className="me-3 border rounded-circle d-flex align-items-center justify-content-center bg-white"
                                        style={{ width: '50px', height: '50px', minWidth: '50px', flexShrink: 0, overflow: 'hidden' }}>
                                        {company.logoPath ? (
                                            <img src={`${company.logoPath}?t=${Date.now()}`} alt={company.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <i className="bi bi-building text-secondary fs-4"></i>
                                        )}
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <h5 className="card-title text-primary fw-bold mb-0 text-truncate" title={company.name}>
                                            {company.name}
                                        </h5>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center mb-2">
                                    <span className="badge bg-secondary me-2">產業</span>
                                    <span className="text-truncate" style={{ maxWidth: '150px' }}>{company.industry}</span>
                                </div>
                                <div className="d-flex align-items-start fw-bold mb-2">
                                    <span className="badge bg-light text-dark border me-1">地址</span>
                                    <span className="text-muted text-truncate" style={{ maxWidth: '180px' }}>{company.address}</span>
                                </div>
                                <div className="d-flex align-items-start fw-bold mb-2">
                                    <span className="badge bg-light text-dark border me-1">成立時間</span>
                                    <small className="text-muted">
                                        {company.foundedDate ? new Date(company.foundedDate).toLocaleDateString() : "未填寫"}
                                    </small>
                                </div>
                            </div>

                            <div className="card-footer bg-white border-0 text-end pt-0 pb-3 d-flex justify-content-end gap-2">
                                <Link to={`/companies/${company.id}`} className="btn btn-outline-secondary btn-sm">查看詳情</Link>
                                <button className="btn btn-outline-danger btn-sm" onClick={(e) => { e.preventDefault(); handleDelete(company.id); }}>刪除</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}