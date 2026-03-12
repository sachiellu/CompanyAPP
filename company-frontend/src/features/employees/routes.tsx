import { Route } from "react-router-dom";

import EmployeeList from './pages/EmployeeList';
import EmployeeDetail from './pages/EmployeeDetail';
import EmployeeCreate from './pages/EmployeeCreate';
import EmployeeEdit from './pages/EmployeeEdit';

export const employeeRoutes = (
    <>
        <Route path="/employees" element={<EmployeeList />} />
        <Route path="/employees/:id" element={<EmployeeDetail />} />
        <Route path="/employees/create" element={<EmployeeCreate />} />
        <Route path="/employees/edit/:id" element={<EmployeeEdit />} />
    </>
);