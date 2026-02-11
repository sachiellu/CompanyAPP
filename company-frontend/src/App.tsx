// src/App.tsx 完整修正版
import { Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import RequireAuth from "./layouts/RequireAuth";

import Login from './features/auth/pages/Login_Glass'; // 確保login用對版本
import Dashboard from './features/dashboard/pages/Dashboard';   

import CompanyList from './features/companies/pages/CompanyList';
import CompanyDetail from './features/companies/pages/CompanyDetail';
import CompanyCreate from './features/companies/pages/CompanyCreate';
import CompanyEdit from './features/companies/pages/CompanyEdit';

import EmployeeList from './features/employees/pages/EmployeeList';
import EmployeeDetail from './features/employees/pages/EmployeeDetail';
import EmployeeCreate from './features/employees/pages/EmployeeCreate';
import EmployeeEdit from './features/employees/pages/EmployeeEdit';

import MissionList from './features/missions/pages/MissionList'; 
import MissionDetail from './features/missions/pages/MissionDetail';
import MissionCreate from './features/missions/pages/MissionCreate';
import MissionEdit from './features/missions/pages/MissionEdit';

export default function App() {
    return (
        <Routes>
            {/* 1. 登入區：不需門禁 */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
            </Route>

            {/* 2. 受保護區：需要門禁 (RequireAuth) + 主版型 (MainLayout) */}
            <Route element={<RequireAuth />}>
                <Route element={<MainLayout />}>
                    {/* 廠商 */}
                    <Route path="/" element={<Dashboard />} /> 

                    <Route path="/companies" element={<CompanyList />} />
                    <Route path="/companies/:id" element={<CompanyDetail />} />
                    <Route path="/companies/create" element={<CompanyCreate />} />
                    <Route path="/companies/edit/:id" element={<CompanyEdit />} />

                    {/* 員工 */}
                    <Route path="/employees" element={<EmployeeList />} />
                    <Route path="/employees/:id" element={<EmployeeDetail />} />
                    <Route path="/employees/create" element={<EmployeeCreate />} />
                    <Route path="/employees/edit/:id" element={<EmployeeEdit />} />

                    {/* 派工 */}
                    <Route path="/missions" element={<MissionList />} />
                    <Route path="/missions/:id" element={<MissionDetail />} />
                    <Route path="/missions/create" element={<MissionCreate />} />
                    <Route path="/missions/edit/:id" element={<MissionEdit />} />

                    {/* 其他 */}
                    <Route path="/users" element={<h2 className="text-center mt-5 text-muted">帳號權限</h2>} />
                </Route>
            </Route>

            {/* 萬用重定向 */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}