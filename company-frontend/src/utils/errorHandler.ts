// src/utils/errorHandler.ts

interface IdentityError {
    description: string;
}

interface ValidationErrors {
    errors?: Record<string, string[]>;
    message?: string;
}

export const extractErrorMessage = (err: unknown): string => {
    let message = "發生未知錯誤，請聯繫系統管理員";

    if (err && typeof err === 'object') {
        // 統一變數名稱為 safeErr
        const safeErr = err as Record<string, unknown>;
        
        const responseObj = safeErr.response as Record<string, unknown> | undefined;
        const errorData = responseObj?.data || safeErr.data;

        if (errorData) {
            // 1. 處理 Identity 錯誤陣列 (如：密碼太短)
            if (Array.isArray(errorData)) {
                //  使用 IdentityError 型別，消除 unused 警告
                const identityErrors = errorData as IdentityError[];
                message = identityErrors[0]?.description || message;
            } 
            // 2. 處理物件型錯誤
            else if (typeof errorData === 'object') {
                const valData = errorData as ValidationErrors;
                
                if (valData.errors && Object.keys(valData.errors).length > 0) {
                    const firstKey = Object.keys(valData.errors)[0];
                    const messages = valData.errors[firstKey];
                    message = Array.isArray(messages) ? messages[0] : message;
                } else if (valData.message) {
                    message = valData.message;
                }
            }
        } else if (err instanceof Error) {
            message = err.message;
        }
    }

    return message;
};