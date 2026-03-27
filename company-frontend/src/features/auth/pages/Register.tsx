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
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const emailFromUrl = params.get('email');
        if (emailFromUrl) setEmail(emailFromUrl);
    }, [location]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            alert("兩次輸入的密碼不一致！");
            return;
        }

        setLoading(true);
        try {
            // 這裡指定一下成功時的回傳型別
            const response = await api.post<{ message: string }>('/auth/register', { email, password });
            
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
        <div className="vh-100 vw-100 position-relative overflow-hidden bg-black">
            {/* 背景層 */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                backgroundImage: `url(${loginBg})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
                    backdropFilter: 'blur(3px)'
                }}></div>
            </div>

            {/* 內容層 */}
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center" style={{ zIndex: 1, paddingLeft: '10%' }}>

                <div className="card border-0 shadow-lg" style={{
                    width: '380px', borderRadius: '20px', padding: '40px',
                    background: 'rgba(15, 23, 42, 0.75)', 
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                }}>
                    <div className="text-center mb-4">
                        <div className="d-inline-block rounded shadow-sm bg-black" style={{ padding: '2px', border: '1px solid rgba(255,255,255,0.2)'}}>
                            <img src={EsLogo} alt="Logo" style={{ width: '46px', height: '46px' }} />
                        </div>
                        <h4 className="fw-bold text-white mt-3 mb-1">員工帳號開通</h4>
                        <p className="text-muted small">請設定您的登入密碼</p>
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

                        <button className="btn btn-primary w-100 py-2 fw-bold rounded-pill shadow-sm mb-4" type="submit" disabled={loading}>
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