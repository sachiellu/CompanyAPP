import { Link } from 'react-router-dom';
import loginBg from '../../../assets/images/login-bg.webp';
import EsLogo from '../../../assets/icons/Logo.svg';

export default function ForgotPassword() {
    return (
        <div className="auth-shell" style={{ backgroundImage: `url(${loginBg})` }}>
            <div className="auth-panel">
                <div className="auth-card">
                    <div className="text-center mb-4">
                        <div className="d-inline-block rounded shadow-sm bg-black" style={{ padding: '2px', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <img src={EsLogo} alt="Logo" style={{ width: '46px', height: '46px' }} />
                        </div>
                        <h4 className="fw-bold text-white mt-3 mb-1">忘記密碼</h4>
                        <p className="text-white-50 small mb-0">此系統採邀請制，無法自助重設密碼。</p>
                    </div>
                    <p className="text-white-50 small">
                        請聯繫管理員，請對方在員工資料重寄邀請信。你會收到開通連結，即可設定新密碼。
                    </p>
                    <Link to="/login" className="btn auth-submit py-2 fw-bold rounded-pill text-white" style={{
                        background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                        border: 'none',
                    }}>
                        返回登入
                    </Link>
                </div>
            </div>
        </div>
    );
}
