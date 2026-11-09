import { Outlet } from "react-router-dom";

export default function AuthLayout() {
    return (
        /* 移除所有限制，直接讓 Outlet 佔滿全螢幕 */
        <div className="w-100 min-vh-100">
            <Outlet />
        </div>
    );
}