// src/features/users/api/userApi.ts
import { api } from '../../../services/api';

export interface User {
    id: string;
    email: string;
    role: string;
    linkedEmployeeName: string;
}

export const userApi = {
    // 取得所有帳號
    getUsers: () => api.get<User[]>('/users'),

    // 變更權限
    changeRole: (userId: string, newRole: string) =>
        api.post('/users/change-role', { userId, newRole }),
};