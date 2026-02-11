import { useState } from 'react';

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

    const handleCheck = (id: number, e?: React.MouseEvent | React.ChangeEvent) => {
        const mouseEvent = e as React.MouseEvent;
        const nativeEvent = mouseEvent?.nativeEvent;

        if (nativeEvent && nativeEvent.shiftKey && lastCheckedId !== null) {
            const start = items.findIndex(i => i.id === lastCheckedId);
            const end = items.findIndex(i => i.id === id);

            const sliced = items.slice(Math.min(start, end), Math.max(start, end) + 1);
            const rangeIds = sliced.map(i => i.id);

            const isAllSelected = rangeIds.every(rid => selectedIds.includes(rid));
            if (isAllSelected) {
                setSelectedIds(prev => prev.filter(pid => !rangeIds.includes(pid)));
            } else {
                const newSet = new Set([...selectedIds, ...rangeIds]);
                setSelectedIds(Array.from(newSet));
            }
        } else {
            if (selectedIds.includes(id)) {
                setSelectedIds(prev => prev.filter(i => i !== id));
            } else {
                setSelectedIds(prev => [...prev, id]);
            }
            setLastCheckedId(id);
        }
    };

    const handleCheckAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedIds(items.map(i => i.id));
        else setSelectedIds([]);
    };

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