    import { api } from '../../../services/api';
    import type { Employee, ImportResult } from '../types';

    export const employeeApi = {
        getEmployees: (s: string = "") => api.get<Employee[]>(s ? `/employees?searchString=${encodeURIComponent(s)}` : '/employees'),
        getEmployeeById: (id: string | number) => api.get<Employee>(`/employees/${id}`),
        deleteEmployee: (id: number) => api.delete(`/employees/${id}`),
        deleteBatch: (ids: number[]) => api.post('/employees/batch-delete', ids),
        restoreEmployee: (id: number) => api.post(`/employees/${id}/restore`),
        hardDeleteEmployee: (id: number) =>api.delete(`/employees/${id}/hard`),
        exportExcel: (ids: number[]) => api.post('/employees/export', ids, { responseType: 'blob' }),
        importExcel: (file: File) => {
            const fd = new FormData();
            fd.append("excelFile", file);
            return api.post<ImportResult>('/employees/import', fd);
        },
            // 發送邀請信
        sendInvite: (id: number) => api.post(`/employees/${id}/invite`,{})
        // hello vite wake up
    };