import { useState } from 'react';

export function useSelection<T extends { id: number }>(items: T[]) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [previewIds, setPreviewIds] = useState<number[]>([]);
    const [rowDragStartId, setRowDragStartId] = useState<number | null>(null);

    // 判斷某一行是否顯示為選取
    const isRowSelected = (id: number) => {
        const isSelected = selectedIds.includes(id);
        const isPreviewing = previewIds.includes(id);
        return isPreviewing ? !isSelected : isSelected;
    };

    // 一般單選/連選
    const handleCheck = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(i => i !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const handleCheckAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedIds(items.map(i => i.id));
        else setSelectedIds([]);
    };

    // Shift 行拖曳邏輯
    const handleRowMouseDown = (id: number, e: React.MouseEvent) => {
        if (e.shiftKey && e.button === 0) {
            e.preventDefault();
            e.stopPropagation();
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