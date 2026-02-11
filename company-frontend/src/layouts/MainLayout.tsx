import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function MainLayout() {
    return (
        <div className="d-flex w-100" style={{ minHeight: "100vh", backgroundColor: '#f4f6f9' }}>
            <Sidebar />

            <div
                className="flex-grow-1 d-flex flex-column"
                style={{ minWidth: 0, height: "100vh", overflow: "hidden" }}
            >
                <main className="flex-grow-1 bg-light position-relative" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}