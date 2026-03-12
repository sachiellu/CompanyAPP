import { useState, useCallback } from 'react';

export function useSelection<T extends { id: number }>(items: T[]) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [previewIds, setPreviewIds] = useState<number[]>([]);
    const [rowDragStartId, setRowDragStartId] = useState<number | null>(null);
    const [lastCheckedId, setLastCheckedId] = useState<number | null>(null);

    const isRowSelected = (id: number) => {
        const isSelected = selectedIds.includes(id);
        const isPreviewing = previewIds.includes(id);
        return isPreviewing ? !isSelected : isSelected;
    };

    // 🔥 核心修正：完全依賴 prevSelected，不依賴外部變數
    const handleCheck = useCallback((id: number, e?: React.MouseEvent) => {
        // 強制轉型，確保讀得到屬性
        const nativeEvent = e?.nativeEvent || e;
        const isCtrlOrCmd = e?.ctrlKey || e?.metaKey || (nativeEvent as MouseEvent)?.ctrlKey || (nativeEvent as MouseEvent)?.metaKey;
        const isShift = e?.shiftKey || (nativeEvent as MouseEvent)?.shiftKey;

        console.log("🖱️ 判定結果:", { id, isCtrlOrCmd, isShift });

        setSelectedIds(prevSelected => {
            // 1. Shift 連選
            if (isShift && lastCheckedId !== null) {
                const start = items.findIndex(i => i.id === lastCheckedId);
                const end = items.findIndex(i => i.id === id);

                if (start === -1 || end === -1) return prevSelected;

                const sliced = items.slice(Math.min(start, end), Math.max(start, end) + 1);
                const rangeIds = sliced.map(i => i.id);
                // 使用 Set 來合併，確保不重複
                const newSet = new Set([...prevSelected, ...rangeIds]);
                return Array.from(newSet);
            }

            // 2. Ctrl 加選/減選
            if (isCtrlOrCmd) {
                if (prevSelected.includes(id)) {
                    return prevSelected.filter(i => i !== id);
                } else {
                    return [...prevSelected, id];
                }
            }

            // 3. 單選 (清除其他，只留自己)
            return [id];
        });

        // 這裡不需要依賴 prev，直接更新即可
        setLastCheckedId(id);

    }, [items, lastCheckedId]); // 依賴項保持這樣

    const handleCheckAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedIds(items.map(i => i.id));
        else setSelectedIds([]);
    };

    const handleRowMouseDown = (id: number, e: React.MouseEvent) => {
        // 只有左鍵且沒按功能鍵才拖曳
        if (e.button === 0 && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            setRowDragStartId(id);
        }
    };

    const handleRowMouseEnter = (id: number) => {
        if (rowDragStartId !== null) {
            const start = items.findIndex(e => e.id === rowDragStartId);
            const end = items.findIndex(e => e.id === id);
            const sliced = items.slice(Math.min(start, end), Math.max(start, end) + 1);
            setPreviewIds(sliced.map(e => e.id));
        }
    };

    return {
        selectedIds,
        setSelectedIds,
        previewIds,
        setPreviewIds,
        rowDragStartId,
        setRowDragStartId,
        isRowSelected,
        handleCheck,
        handleCheckAll,
        handleRowMouseDown,
        handleRowMouseEnter
    };
}