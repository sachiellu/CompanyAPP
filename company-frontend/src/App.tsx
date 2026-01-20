import { Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';


// 引入剛剛建的 Layout
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import RequireAuth from "./layouts/RequireAuth";


// 引入頁面
import Login from './pages/Login';
import CompanyList from './pages/companies/CompanyList';
import CompanyDetail from './pages/companies/CompanyDetail';
import CompanyCreate from './pages/companies/CompanyCreate';
import CompanyEdit from './pages/companies/CompanyEdit';

import EmployeeList from './pages/employees/EmployeeList';
import EmployeeCreate from './pages/employees/EmployeeCreate';
import EmployeeDetail from './pages/employees/EmployeeDetail';
import EmployeeEdit from './pages/employees/EmployeeEdit';
import EmployeeImport from './pages/employees/EmployeeImport';

export default function App() { 
    return (
        <Routes>

            {/* 登入頁 */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
            </Route>

            {/*  門禁 */}
            <Route element={<RequireAuth />}>

                {/*  主版型 */}
                <Route element={<MainLayout />}>

                     {/*廠商*/}
                    <Route path="/" element={<CompanyList />} />
                    <Route path="/companies/:id" element={<CompanyDetail />} />
                    <Route path="/companies/create" element={<CompanyCreate />} />
                    <Route path="/companies/edit/:id" element={<CompanyEdit />} />

                    {/*員工*/}
                    <Route path="/employees" element={<EmployeeList />} />
                    <Route path="/employees/create" element={<EmployeeCreate />} />
                    <Route path="/employees/:id" element={<EmployeeDetail />} />
                    <Route path="/employees/edit/:id" element={<EmployeeEdit />} />
                    <Route path="/employees/import" element={<EmployeeImport />} />


                    <Route path="/missions" element={<h2 className="text-center mt-5 text-muted">任務派工</h2>} />
                    <Route path="/users" element={<h2 className="text-center mt-5 text-muted">帳號權限</h2>} />

                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}