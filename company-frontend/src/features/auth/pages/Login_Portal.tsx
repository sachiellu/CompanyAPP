import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5203/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.role); // 例如 'Admin'
                localStorage.setItem('userEmail', data.email);
                navigate('/');
            } else {
                alert("帳號或密碼錯誤");
            }
        } catch (err) {
            console.error("API 連線失敗", err);
            alert("伺服器連線異常，請檢查網路狀態");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="vh-100 vw-100 bg-light d-flex flex-column" style={{ position: 'fixed', top: 0, left: 0, zIndex: 1050 }}>

            {/* 1. 頂部 Logo 區 (正式門戶感) */}
            <header className="p-4 bg-white shadow-sm border-bottom">
                <div className="container-fluid d-flex align-items-center">
                    <i className="bi bi-boxes text-primary fs-3 me-3"></i>
                    <div className="border-start ps-3">
                        <h4 className="m-0 fw-bold text-dark">ERP SYSTEM</h4>
                        <span className="text-muted small text-uppercase" style={{ letterSpacing: '1px' }}>企業資源整合管理門戶</span>
                    </div>
                </div>
            </header>

            {/* 2. 主內容區 */}
            <main className="flex-grow-1 d-flex align-items-center">
                <div className="container">
                    <div className="row align-items-center">

                        {/* 左側：系統說明/公告 (大螢幕才顯示) */}
                        <div className="col-lg-6 d-none d-lg-block border-end pe-5 text-start">
                            <h2 className="fw-bold mb-4 text-dark">企業數位協作平台</h2>
                            <div className="mb-4 d-flex">
                                <div className="me-4 text-primary bg-white shadow-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', flexShrink: 0 }}>
                                    <i className="bi bi-shield-check fs-2"></i>
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1">身分安全驗證</h5>
                                    <p className="text-muted small">所有登入行為均受 256 位元加密保護，確保企業資料不外洩。</p>
                                </div>
                            </div>
                            <div className="mb-4 d-flex">
                                <div className="me-4 text-primary bg-white shadow-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', flexShrink: 0 }}>
                                    <i className="bi bi-clock-history fs-2"></i>
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1">即時派工同步</h5>
                                    <p className="text-muted small">手機端與 PC 端即時對接，任務狀態秒級更新。</p>
                                </div>
                            </div>
                            <div className="d-flex">
                                <div className="me-4 text-primary bg-white shadow-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', flexShrink: 0 }}>
                                    <i className="bi bi-graph-up-arrow fs-2"></i>
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1">數據驅動決策</h5>
                                    <p className="text-muted small">精確追蹤廠商與員工表現，提升企業整體營運效率。</p>
                                </div>
                            </div>
                        </div>

                        {/* 右側：登入框 */}
                        <div className="col-12 col-lg-5 offset-lg-1">
                            <div className="bg-white p-5 shadow-lg rounded-4 border-0">
                                <div className="text-center text-lg-start mb-4">
                                    <h4 className="fw-bold text-dark mb-1">使用者登入</h4>
                                    <p className="text-muted small">請輸入您的企業帳號以進入系統</p>
                                </div>

                                <form onSubmit={handleLogin} className="text-start">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted text-uppercase">帳號 (Email)</label>
                                        <input
                                            className="form-control form-control-lg bg-light border-0 shadow-none fs-6"
                                            placeholder="name@company.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label small fw-bold text-muted text-uppercase">密碼</label>
                                        <input
                                            type="password"
                                            className="form-control form-control-lg bg-light border-0 shadow-none fs-6"
                                            placeholder="請輸入密碼"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button
                                        className="btn btn-dark w-100 py-3 fw-bold rounded-3 shadow mb-3"
                                        type="submit"
                                        disabled={loading}
                                    >
                                        {loading ? "連線中..." : "立即登入"}
                                    </button>

                                    <div className="text-center mt-3">
                                        <p className="small text-muted mb-0">需要協助？<a href="#" className="text-primary fw-bold text-decoration-none ms-1">下載操作手冊</a></p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* 3. 頁尾 */}
            <footer className="p-3 bg-white border-top text-center text-muted small">
                聯繫技術支援：02-1234-5678 | privacy policy | terms of service
                <div className="mt-1 opacity-50">© 2025 企業資源管理系統 V1.0 </div>
            </footer>
        </div>
    );
}