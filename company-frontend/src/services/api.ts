const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5203/api';

export interface ApiResponse<T> {
    data: T;
    status: number;
    ok: boolean;
    blob: () => Promise<Blob>;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
    if (options.headers) Object.assign(headers, options.headers);
    if (options.body instanceof FormData) delete headers['Content-Type'];

    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    if (response.status === 401) { window.location.href = '/login'; throw new Error("Unauthorized"); }


    let data: T;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        data = await response.json() as T;
    } else {
        data = null as unknown as T;
    }
    return { data, status: response.status, ok: response.ok, blob: () => response.blob() };
}

export const api = {
    get: <T>(url: string) => request<T>(url, { method: 'GET' }),
    post: <T>(url: string, body: unknown) => request<T>(url, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
    put: <T>(url: string, body: unknown) => request<T>(url, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
    delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};