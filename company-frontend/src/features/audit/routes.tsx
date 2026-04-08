// src/features/audit/routes.tsx
import { Route } from "react-router-dom";
import AuditLogList from './pages/AuditLogList';

export const auditRoutes = (
    <Route path="/audit-logs" element={<AuditLogList />} />
);