// src/features/auth/pages/Login_Split.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5203/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.role);
                localStorage.setItem('userEmail', data.email);
                navigate('/');
            } else {
                alert("登入失敗，請檢查帳號密碼");
            }
        } catch (err) {
            console.error("API 連線失敗", err);
        }
    };


    return (
        /* 關鍵修正：加上 position: fixed, top: 0, left: 0 以確保它覆蓋全螢幕，不受 Main 控制 */
        <div className="container-fluid p-0 vh-100 vw-100 bg-white" style={{ position: 'fixed', top: 0, left: 0, zIndex: 1050 }}>
            <div className="row g-0 h-100">

                {/* 左側：品牌視覺區 */}
                <div className="d-none d-lg-flex col-lg-7 h-100 position-relative p-0 border-end">
                    <img
                        src="https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=2070"
                        alt="Workplace"
                        className="w-100 h-100 object-fit-cover"
                    />
                    <div className="position-absolute w-100 h-100 top-0 start-0 d-flex flex-column justify-content-center p-5 text-white text-start"
                        style={{ background: 'linear-gradient(135deg, rgba(13,110,253,0.85) 0%, rgba(0,0,0,0.4) 100%)' }}>
                        <h1 className="display-2 fw-bold mb-4" style={{ letterSpacing: '4px', lineHeight: '1.2' }}>
                            企業資源<br />管理系統
                        </h1>
                        <p className="fs-4 opacity-75 mb-5">專業、安全、高效的派工與資源整合平台。</p>

                        <div className="d-flex gap-3">
                            <span className="badge bg-white text-primary px-3 py-2 rounded-pill fw-bold shadow">v1.0 正式版</span>
                            <span className="badge border border-white text-white px-3 py-2 rounded-pill">企業級安全防護</span>
                        </div>
                    </div>
                </div>

                {/* 右側：登入表單區 */}
                <div className="col-12 col-lg-5 h-100 d-flex align-items-center justify-content-center bg-white">
                    <div className="p-4 p-md-5 w-100" style={{ maxWidth: '480px' }}>
                        <div className="text-center text-lg-start mb-5">
                            <h2 className="display-6 fw-bold text-dark mb-2">歡迎登入</h2>
                            <p className="text-muted fs-5">請輸入您的企業帳號以繼續</p>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div className="mb-4 text-start">
                                <label className="form-label small fw-bold text-muted text-uppercase">電子信箱</label>
                                <div className="input-group input-group-lg shadow-sm">
                                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-person"></i></span>
                                    <input
                                        type="email"
                                        className="form-control border-start-0 ps-0 fs-6 shadow-none"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-5 text-start">
                                <label className="form-label small fw-bold text-muted text-uppercase">登入密碼</label>
                                <div className="input-group input-group-lg shadow-sm">
                                    <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-lock"></i></span>
                                    <input
                                        type="password"
                                        className="form-control border-start-0 ps-0 fs-6 shadow-none"
                                        placeholder="請輸入密碼"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button className="btn btn-primary btn-lg w-100 fw-bold py-3 shadow mb-4" type="submit">
                                立即進入系統
                            </button>

                            <div className="text-center">
                                <p className="text-muted small">
                                    忘記密碼？請聯絡管理員
                                    <br />
                                    <span className="text-primary fw-bold" style={{ cursor: 'pointer' }}>it-support@company.com</span>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}