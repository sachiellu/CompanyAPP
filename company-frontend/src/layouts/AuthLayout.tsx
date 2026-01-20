import { Outlet } from "react-router-dom";

export default function AuthLayout() {
    return (
        // vh-100: 全螢幕高度
        // d-flex justify-content-center align-items-center: 讓內容上下左右完全置中
        // bg-light: 淺灰背景
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light w-100">

            {/* 限制最大寬度 450px，確保登入框不會變成一條線或太寬 */}
            <div className="w-100 px-3" style={{ maxWidth: "450px" }}>
                <Outlet />
            </div>
        </div>
    );
}