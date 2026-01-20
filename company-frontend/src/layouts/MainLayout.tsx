import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function MainLayout() {
    return (
        <div className="d-flex w-100" style={{ minHeight: "100vh", backgroundColor: '#f4f6f9' }}>
            <Sidebar />

            <div
                className="flex-grow-1 d-flex flex-column"
                style={{ minWidth: 0, height: "100vh", overflow: "hidden" }}
            >
                <main className="flex-grow-1 p-4" style={{ overflowY: "auto" }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}