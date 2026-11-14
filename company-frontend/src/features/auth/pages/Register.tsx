import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../../../services/api'; 
import loginBg from '../../../assets/images/login-bg.webp';
import EsLogo from '../../../assets/icons/Logo.svg';

import { extractErrorMessage } from '../../../utils/errorHandler';

export default function Register() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const emailFromUrl = params.get('email');
        const tokenFromUrl = params.get('token');
        if (emailFromUrl) setEmail(emailFromUrl);
        if (tokenFromUrl) setToken(tokenFromUrl);
    }, [location]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!token) {
            alert("請使用邀請信中的連結開通帳號。");
            return;
        }

        if (password !== confirmPassword) {
            alert("兩次輸入的密碼不一致！");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post<{ message: string }>('/auth/register', { email, password, token });
            
            const successMsg = response.data?.message || "註冊成功！";
            alert(successMsg);
            navigate('/login');

        } catch (err: unknown) {
            console.error("註冊出錯:", err);

            const errorMsg = extractErrorMessage(err);
            alert("錯誤：" + errorMsg);


        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-shell" style={{ backgroundImage: `url(${loginBg})` }}>
            <div className="auth-panel">
                <div className="auth-card">
                    <div className="text-center mb-4">
                        <div className="d-inline-block rounded shadow-sm bg-black" style={{ padding: '2px', border: '1px solid rgba(255,255,255,0.2)'}}>
                            <img src={EsLogo} alt="Logo" style={{ width: '46px', height: '46px' }} />
                        </div>
                        <h4 className="fw-bold text-white mt-3 mb-1">員工帳號開通</h4>
                        <p className="text-muted small">{token ? "請設定您的登入密碼" : "請使用邀請信中的連結開通"}</p>
                    </div>

                    <form onSubmit={handleRegister} className="text-start">
                        <div className="mb-3">
                            <label className="form-label fw-bold text-white small">Email</label>
                            <input
                                type="email"
                                className="form-control bg-white bg-opacity-75 py-2"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                disabled={!!new URLSearchParams(location.search).get('email')} 
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold text-white small">密碼</label>
                            <input
                                type="password"
                                className="form-control bg-white bg-opacity-75 py-2"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="請輸入密碼"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold text-white small">確認密碼</label>
                            <input
                                type="password"
                                className="form-control bg-white bg-opacity-75 py-2"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="請再次輸入密碼"
                                required
                            />
                        </div>

                        <button className="btn btn-primary auth-submit py-2 fw-bold rounded-pill shadow-sm mb-4" type="submit" disabled={loading}>
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : "開通帳號"}
                        </button>

                        <div className="text-center">
                            {/*  已使用 Link */}
                            <Link to="/login" className="btn btn-link text-white-50 p-0 text-decoration-none small hover-text-white">
                                返回登入
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}