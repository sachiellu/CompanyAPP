import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function MainLayout() {
    const location = useLocation();
    const [navOpen, setNavOpen] = useState(false);

    useEffect(() => {
        setNavOpen(false);
    }, [location.pathname]);

    return (
        <div className="app-shell d-flex w-100">
            {navOpen && (
                <button
                    type="button"
                    className="app-sidebar-backdrop d-md-none"
                    aria-label="關閉選單"
                    onClick={() => setNavOpen(false)}
                />
            )}
            <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />

            <div className="app-main flex-grow-1 d-flex flex-column">
                <header className="app-topbar d-md-none">
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        aria-label="開啟選單"
                        onClick={() => setNavOpen(true)}
                    >
                        <i className="bi bi-list" style={{ fontSize: "1.25rem" }}></i>
                    </button>
                    <span className="fw-bold text-dark">企業管理系統</span>
                </header>
                <main className="flex-grow-1 bg-light position-relative app-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
