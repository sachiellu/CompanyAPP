import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import loginBg from '../../../assets/images/login-bg.webp';
import EsLogo from '../../../assets/icons/Logo.svg';
import { useZoomPan } from '../../../hooks/useZoomPan';

export default function Login() {
    const { view, elastic, containerRef, isDragging, resetAll } = useZoomPan();

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
                localStorage.setItem('userRole', data.role);
                localStorage.setItem('userEmail', data.email);
                navigate('/');
            } else {
                alert("帳號或密碼錯誤");
            }
        } catch (err) {
            console.error("API 連線失敗", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            ref={containerRef}
            className="vh-100 vw-100 position-relative overflow-hidden bg-black text-start"
            style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, cursor: isDragging ? 'grabbing' : 'default' }}
            onDoubleClick={resetAll}
        >
            <div className="w-100 h-100 position-absolute" style={{ zIndex: 1 }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundImage: `url(${loginBg})`, backgroundSize: 'cover', backgroundPosition: 'center',
                    filter: 'blur(5px) brightness(0.9)', transform: 'scale(1.15)'
                }}></div>
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)'
                }}></div>
            </div>

            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                transform: `translate(${view.x + elastic.x}px, ${view.y + elastic.y}px) scale(${view.scale})`,
                transformOrigin: '25% 50%',
                transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                zIndex: 10,
                display: 'flex',
                pointerEvents: 'none'
            }}>
                <div style={{ width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '5%', pointerEvents: 'auto' }}>
                    <div className="card border-0 shadow-lg" style={{
                        width: '350px', // 100% 視角下 350px 最精緻
                        borderRadius: '16px',
                        padding: '30px',
                        background: 'rgba(255, 255, 255, 0.82)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.4)'
                    }} onMouseDown={e => e.stopPropagation()}>

                        <div className="text-center mb-4">
                            <img src={EsLogo} alt="Logo" style={{ width: '60px', height: '60px' }} />
                            <h5 className="fw-bold text-dark mt-2 mb-1">企業資源管理</h5>
                            <p className="text-muted" style={{ fontSize: '10px', letterSpacing: '1px' }}>Smart Management Portal</p>
                        </div>

                        <form onSubmit={handleLogin} className="text-start"> {/* 用到 handleLogin */}
                            <div className="mb-3">
                                <label className="form-label fw-bold text-secondary small text-uppercase" style={{ fontSize: '11px' }}>帳號 / Email</label>
                                <input className="form-control border-0 bg-white bg-opacity-60 py-2 shadow-none shadow-sm" style={{ fontSize: '14px' }} value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <div className="mb-4">
                                <label className="form-label fw-bold text-secondary small text-uppercase" style={{ fontSize: '11px' }}>登入密碼</label>
                                <input type="password" title="password" className="form-control border-0 bg-white bg-opacity-60 py-2 shadow-none shadow-sm" style={{ fontSize: '14px' }} value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>
                            <button className="btn btn-primary w-100 py-2 fw-bold rounded-pill shadow-sm mb-4" type="submit" disabled={loading}>
                                {loading ? "連線中..." : "立即進入系統"}
                            </button>

                            <div className="text-center">
                                <span className="text-muted" style={{ fontSize: '12px', opacity: 0.6 }}>
                                    © 2025 企業資源管理系統 V1.0
                                </span>
                            </div>
                        </form>
                    </div>
                </div>
                <div style={{ width: '65%' }}></div>
            </div>
        </div>
    );
}