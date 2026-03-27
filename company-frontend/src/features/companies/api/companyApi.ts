import { api } from '../../../services/api';
import type { Company } from '../types';

export const companyApi = {
    getCompanies: (s: string = "") => api.get<Company[]>(s ? `/companies?searchString=${encodeURIComponent(s)}` : '/companies'),
    getCompanyById: (id: string | number) => api.get<Company>(`/companies/${id}`),
    deleteCompany: (id: string | number) => api.delete(`/companies/${id}`),
    deleteBatch: (ids: number[]) => api.post('/companies/delete-batch', ids),
    exportExcel: (ids: number[]) => api.post('/companies/export', ids, { responseType: 'blob' }),
    // 對接後端 UpdateAsync，上傳檔案用 ImageFile 欄位
    updateCompany: (id: string | number, formData: FormData) => api.put(`/companies/${id}`, formData)
};
