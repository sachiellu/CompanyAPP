// src/features/auth/authApi.ts
import { api } from '../../services/api'; 


export const authApi = {
    login: async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        return res.data;
    },
    demoLogin: async (role: 'Admin' | 'User') => {
        const res = await api.post('/auth/demo-login', { role });
        return res.data;
    },
    logout: async () => {
        await api.post('/auth/logout');
    }
};
