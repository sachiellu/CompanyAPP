// src/hooks/useEscBack.ts
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 按下 Esc 鍵返回指定路徑
 * @param targetPath 要返回的路徑，預設為 '/' (廠商列表)
 */
export function useEscBack(targetPath: string = '/') {
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                // 如果是在輸入框、文字區域中按下 Esc，通常不觸發返回
                // 但如果你希望「強制返回」，可以把下面這行 if 拿掉
                const target = event.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

                navigate(targetPath);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        // 清除監聽器，避免影響到其他不需要此功能的頁面
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate, targetPath]);
}