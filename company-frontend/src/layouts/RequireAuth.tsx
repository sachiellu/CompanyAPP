// src/layouts/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function RequireAuth() {
    const token = localStorage.getItem('token'); // 確保這裡的 Key 叫 'token'
    const location = useLocation();

    // 除錯用：打開瀏覽器 F12 看看有沒有印出 "Token found"
    console.log("Checking Auth, Token:", token);

    if (!token) {
        // 如果沒 Token，踢回登入頁，並記住原本想去的地方 (from)
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}