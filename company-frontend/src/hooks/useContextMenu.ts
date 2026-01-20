// 處理右鍵選單定位

import { useState, useEffect } from 'react';

export function useContextMenu() {
    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; id: number | null }>({
        visible: false, x: 0, y: 0, id: null
    });

    const handleContextMenu = (e: React.MouseEvent, id: number | null) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            id: id
        });
    };

    // 點擊別處關閉
    useEffect(() => {
        const handleClick = () => setContextMenu({ ...contextMenu, visible: false });
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, [contextMenu]);

    return {
        contextMenu,
        handleContextMenu
    };
}