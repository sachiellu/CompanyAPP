import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../authApi';
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
            localStorage.setItem('userEmail', email);
            navigate('/');
        } catch (err) {
            console.error(err);
            alert("帳號或密碼錯誤");
        } finally {
            setLoading(false);
        }
    };


    // 展示登入
    const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
        // 1. 先讓輸入框出現文字（視覺效果）
        setEmail(demoEmail);
        setPassword(demoPass);
        setLoading(true);

        try {
            // 2.  直接傳入參數，不要等 setEmail 更新，這樣絕對不會 401
            const data = await authApi.login(demoEmail, demoPass);
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('userEmail', demoEmail);
            
            navigate('/');
        } catch (err) {
            console.error(err);
            alert("Demo 帳號登入失敗，請檢查 SeedData");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="vh-100 vw-100 position-relative overflow-hidden bg-black">

            {/* 1. 背景層 */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                backgroundImage: `url(${loginBg})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0
            }}>
                {/* 1.1 背景遮罩：既然卡片是黑的，整體背景也稍微壓暗，讓水庫看起來更有質感 */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)', // 改成黑色遮罩
                    backdropFilter: 'blur(3px)'
                }}></div>
            </div>

            {/* 2. 內容層 */}
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center" style={{ zIndex: 1, paddingLeft: '10%' }}>
                
                {/* 卡片本體：深色毛玻璃 */}
                <div className="card border-0 shadow-lg" style={{
                    width: '380px', borderRadius: '20px', padding: '40px',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)', // 用稍微帶點藍的深黑色
                    backdropFilter: 'blur(16px)', // 增加模糊度，質感更好
                    border: '1px solid rgba(255, 255, 255, 0.15)', // 邊框變細緻
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}>
                    <div className="text-center mb-4">
                        {/* 如果你的 Logo 是黑底，可以給它一點白色光暈才不會融入背景 */}
                        <div className="d-inline-block rounded shadow-sm bg-black" style={{ padding: '2px', border: '1px solid rgba(255,255,255,0.2)'}}>
                            <img src={EsLogo} alt="Logo" style={{ width: '46px', height: '46px' }} />
                        </div>
                        
                        {/* 文字全部改為白色系 */}
                        <h4 className="fw-bold text-white mt-3 mb-1">企業資源管理</h4>
                        <p className="text-white-50 small text-uppercase spacing-1">Smart Management Portal</p>
                    </div>

                    <form onSubmit={handleLogin} className="text-start">
                        <div className="mb-3">
                            <label className="form-label fw-bold text-light small">帳號 / EMAIL</label>
                            {/* 輸入框改成半透明黑色，文字為白色 */}
                            <input
                                className="form-control bg-dark bg-opacity-50 text-white border-secondary py-2"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                style={{ colorScheme: 'dark' }} // 讓瀏覽器知道這是深色模式
                                required
                            />
                        </div>
                        
                        <div className="mb-4">
                            <label className="form-label fw-bold text-light small">登入密碼</label>
                            <input
                                type="password"
                                className="form-control bg-dark bg-opacity-50 text-white border-secondary py-2"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                style={{ colorScheme: 'dark' }}
                                required
                            />
                        </div>

                        {/* 主按鈕：使用有漸層的科技水藍色 */}
                        <button
                            className="btn w-100 py-2 fw-bold rounded-pill shadow mb-4 text-white"
                            type="submit"
                            disabled={loading}
                            style={{ 
                                background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)', 
                                border: 'none' 
                            }}
                        >
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : "立即進入系統"}
                        </button>

                        <div className="d-flex justify-content-end align-items-center mb-4">
                            <Link to="/forgot-password" className="btn btn-link text-white-50 p-0 text-decoration-none small hover-text-white">
                                忘記密碼？
                            </Link>
                        </div>

                        <div className="text-center">
                            <span className="text-white-50 small opacity-75">
                                © 2025 企業資源管理系統 V1.0
                            </span>
                        </div>

                        
                    </form>

                    {/* 增加展示區塊 */}
                    <div className="mt-4 pt-3 border-top border-secondary border-opacity-25 text-center">
                        <p className="text-white-50 small mb-2">展示用快速登入：</p>
                        <div className="d-flex justify-content-center gap-2">
                            <button 
                                type="button"
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleDemoLogin('admin@default.com', 'Admin123!')}
                            >
                                管理員 (Admin)
                            </button>
                            <button 
                                type="button"
                                className="btn btn-sm btn-outline-light"
                                onClick={() => handleDemoLogin('user@default.com', 'User123!')}
                            >
                                一般員工 (User)
                            </button>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    );
}