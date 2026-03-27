// src/features/auth/authApi.ts
import { api } from '../../services/api'; 


export const authApi = {
    login: async (email: string, password: string) => {
        // 使用 api.post，它會自動帶上 withCredentials: true
        const res = await api.post('/auth/login', { email, password });
        
        // Axios 的資料是在 .data 裡面
        return res.data; 
    }
};