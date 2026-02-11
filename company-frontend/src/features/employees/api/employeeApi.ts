import { api } from '../../../services/api';
import type { Employee, ImportResult } from '../types';

export const employeeApi = {
    getEmployees: (s: string = "") => api.get<Employee[]>(s ? `/employees?searchString=${encodeURIComponent(s)}` : '/employees'),
    getEmployeeById: (id: string | number) => api.get<Employee>(`/employees/${id}`),
    deleteEmployee: (id: number) => api.delete(`/employees/${id}`),
    deleteBatch: (ids: number[]) => api.post('/employees/delete-batch', ids),
    exportExcel: (ids: number[]) => api.post<Blob>('/employees/export', ids),
    importExcel: (file: File) => {
        const fd = new FormData();
        fd.append("excelFile", file);
        return api.post<ImportResult>('/employees/import', fd);
    }
};