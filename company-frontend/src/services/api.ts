import axios, { AxiosError } from 'axios';

// 1. 建立實例
export const api = axios.create({
// 修改這裡：如果是生產環境，直接用相對路徑 '/api'
    // 這樣不管你是在 localhost 還是 fly.dev，它都會自動對齊
    baseURL: import.meta.env.DEV ? 'http://localhost:5203/api' : '/api', 
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});
export const companyApi = {
    exportExcel: (ids: number[]) => 
        api.post('/companies/export', ids, { responseType: 'blob' }) // 關鍵：告知 Axios 這是檔案
};

// 2. 請求攔截器：自動注入 Token
api.interceptors.request.use((config) => {
    // 理由：因為我們開啟了 withCredentials: true
    // 瀏覽器會自動在 Request 中帶上名為 "X-Access-Token" 的 Cookie
    // 我們完全不需要手動去塞 config.headers.Authorization 了
    
    // 如果你發現某些舊的功能壞掉，那通常是因為那些 API 沒寫好，
    // 而不是攔截器的問題。在目前的 Cookie 架構下，這裡保持乾淨是最正確的。
    return config;
});

// 3. 回應攔截器：統一處理常見的那「四種錯誤」
api.interceptors.response.use(
    (response) => response, // 2xx 成功直接回傳
    (error: AxiosError) => {
        if (error.response) {
            const status = error.response.status;
            
            // 這就是「自動攔截」
           if (status === 401 && !error.config?.url?.includes('/auth/login')) {
                alert("登入逾時，請重新登入");
                window.location.href = '/login';
            }
            
            // 403, 500 維持原樣
            if (status === 403) alert("權限不足");
            if (status === 500) alert("伺服器故障");
        }    
        // 400 錯誤我們拋回去，讓頁面的 catch 處理具體驗證訊息
        return Promise.reject(error);
    }
);
