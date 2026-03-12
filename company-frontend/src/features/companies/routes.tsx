import { Route } from "react-router-dom";

import CompanyList from './pages/CompanyList';
import CompanyDetail from './pages/CompanyDetail';
import CompanyCreate from './pages/CompanyCreate';
import CompanyEdit from './pages/CompanyEdit';

export const companyRoutes = (
    <>
        <Route path="/companies" element={<CompanyList />} />
        <Route path="/companies/:id" element={<CompanyDetail />} />
        <Route path="/companies/create" element={<CompanyCreate />} />
        <Route path="/companies/edit/:id" element={<CompanyEdit />} />
    </>
);