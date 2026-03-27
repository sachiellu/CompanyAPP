// src/App.tsx 完整修正版
import { Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import RequireAuth from "./layouts/RequireAuth";

import Login from './features/auth/pages/Login_Glass(dark)'; // 確保login用對版本
import Dashboard from './features/dashboard/pages/Dashboard';
import Register from './features/auth/pages/Register';   

import { companyRoutes } from "./features/companies/routes";
import { employeeRoutes } from "./features/employees/routes";
import { missionRoutes } from "./features/missions/routes";
import { userRoutes } from "./features/users/routes";

export default function App() {
    return (
        <Routes>

            <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Route>

            <Route element={<RequireAuth />}>
                <Route element={<MainLayout />}>

                    <Route path="/" element={<Dashboard />} />

                    {companyRoutes}
                    {employeeRoutes}
                    {missionRoutes}
                    {userRoutes}

                </Route>
            </Route>

            {/* 萬用重定向 */}
            <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
    );
}