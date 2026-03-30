import axios, { AxiosError } from 'axios';

type UnknownObject = { [key: string]: unknown };

// 把物件所有的 Key 轉為小寫開頭 (camelCase)
const toCamel = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    // 這裡使用 unknown[] 就不會報 any 錯誤
    return obj.map((v) => toCamel(v));
  } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    // 這裡參考你 errorHandler 的作法，將 obj 視為 UnknownObject
    const safeObj = obj as UnknownObject;
    return Object.keys(safeObj).reduce<UnknownObject>((result, key) => {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      return {
        ...result,
        [camelKey]: toCamel(safeObj[key]),
      };
    }, {});
  }
  return obj;
};

// 1. 建立實例
export const api = axios.create({
    baseURL: import.meta.env.DEV ? 'http://localhost:5203/api' : '/api',
    withCredentials: true,
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

// 3. 回應攔截器 (合併功能)
api.interceptors.response.use(
    (response) => {
        // A. 成功回傳時，自動將資料轉為小寫開頭
        if (response.data && response.headers['content-type']?.includes('application/json')) {
            response.data = toCamel(response.data);

            
            console.log("DEBUG: 轉換後的資料物件:", response.data);
        }
        return response;
    },
    (error: AxiosError) => {
        // B. 錯誤處理
        if (error.response) {
            const status = error.response.status;
            if (status === 401 && !error.config?.url?.includes('/auth/login')) {
                alert("登入逾時，請重新登入");
                window.location.href = '/login';
            }
            if (status === 403) alert("權限不足");
            if (status === 500) alert("伺服器故障");
        }
        return Promise.reject(error);
    }
);
