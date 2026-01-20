import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // 登入 API 邏輯
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5203/api';
        const apiUrl = `${baseUrl}/auth/login`;

        try {
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) throw new Error("登入失敗");

            const data = await res.json();
            localStorage.setItem('token', data.token);

            alert("登入成功！");
            navigate('/');
        } catch (err) {
            console.error(err);
            alert("帳號密碼錯誤或伺服器異常");
        }
    };

    return (
        // 這裡不需要 container 或 row，直接寫 Card
        <div className="card shadow border-0">
            <div className="card-header bg-primary text-white py-3 text-center">
                <h4 className="mb-0 fw-bold"> <i className="bi bi-person-circle me-2"></i>系統登入</h4>
            </div>
            <div className="card-body p-4">
                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label text-muted">Email</label>
                        <input
                            className="form-control form-control-lg"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="form-label text-muted">密碼</label>
                        <input
                            className="form-control form-control-lg"
                            type="password"
                            placeholder="請輸入密碼"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary w-100 py-2 fs-5">登入</button>
                </form>
            </div>
            <div className="card-footer bg-light text-center py-3 text-muted small">
                請輸入系統管理員帳號密碼
            </div>
        </div>
    );
}