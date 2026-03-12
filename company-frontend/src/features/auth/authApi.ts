// src/features/auth/authApi.ts
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5203/api';

export const authApi = {
    login: async (email: string, password: string) => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || "帳號或密碼錯誤");
        }

        return res.json(); // 回傳 { token, role, email ... }
    }
};