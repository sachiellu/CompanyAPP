import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../../features/auth/authApi';
import loginBg from '../../../assets/images/login-bg.webp';
import EsLogo from '../../../assets/icons/Logo.svg';

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await authApi.login(email, password);
            localStorage.setItem('token', data.token);
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('userEmail', data.email);
            navigate('/');
        } catch (err) {
            console.error(err);
            alert("帳號或密碼錯誤");
        } finally {
            setLoading(false);
        }
    };

    return (
        // 外層容器：全螢幕、相對定位
        <div className="vh-100 vw-100 position-relative overflow-hidden bg-black">

            {/* 1. 背景層 (靜態) */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '100%', height: '100%',
                backgroundImage: `url(${loginBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 0
            }}>
                {/* 1.1 白色質感遮罩 (靜態) */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '100%', height: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.35)', // 35% 白色遮罩
                    backdropFilter: 'blur(2px)' // 輕微模糊背景，讓文字更清楚
                }}></div>
            </div>

            {/* 2. 內容層 (負責排版卡片位置) */}
            <div
                className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center"
                style={{
                    zIndex: 1,
                    paddingLeft: '10%' // 保持你喜歡的「靠左」排版
                }}
            >
                {/* 卡片本體 */}
                <div
                    className="card border-0 shadow-lg"
                    style={{
                        width: '380px',
                        borderRadius: '20px',
                        padding: '40px',
                        background: 'rgba(255, 255, 255, 0.85)', // 毛玻璃基底
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}
                >
                    <div className="text-center mb-4">
                        <img src={EsLogo} alt="Logo" style={{ width: '50px', height: '50px' }} />
                        <h4 className="fw-bold text-dark mt-3 mb-1">企業資源管理</h4>
                        <p className="text-muted small text-uppercase spacing-1">Smart Management Portal</p>
                    </div>

                    <form onSubmit={handleLogin} className="text-start">
                        <div className="mb-3">
                            <label className="form-label fw-bold text-secondary small">帳號 / EMAIL</label>
                            <input
                                className="form-control bg-white bg-opacity-75 py-2"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="form-label fw-bold text-secondary small">登入密碼</label>
                            <input
                                type="password"
                                className="form-control bg-white bg-opacity-75 py-2"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            className="btn btn-primary w-100 py-2 fw-bold rounded-pill shadow-sm mb-4"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "連線中..." : "立即進入系統"}
                        </button>

                        <div className="text-center">
                            <span className="text-muted small opacity-50">
                                © 2025 企業資源管理系統 V1.0
                            </span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}