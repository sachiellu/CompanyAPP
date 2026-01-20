import { useState, useRef, useEffect } from 'react';

interface UseDragSelectProps {
    containerRef: React.RefObject<HTMLDivElement | null>;
    selectedIds: number[];
    setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
    setPreviewIds: React.Dispatch<React.SetStateAction<number[]>>;
    previewIds: number[];
    rowDragStartId: number | null;
    setRowDragStartId: React.Dispatch<React.SetStateAction<number | null>>;
}

export function useDragSelect({
    containerRef,
    selectedIds,
    setSelectedIds,
    setPreviewIds,
    previewIds,
    rowDragStartId,
    setRowDragStartId
}: UseDragSelectProps) {

    const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const isBoxSelecting = useRef(false);
    const hasDragged = useRef(false);
    const startPos = useRef<{ x: number, y: number } | null>(null);

    // 對應 EmployeeList: handleContainerMouseDown
    const handleContainerMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) return;

        if (e.button === 0 && containerRef.current) {
            e.preventDefault();
            isBoxSelecting.current = true;
            hasDragged.current = false;
            setPreviewIds([]);

            const rect = containerRef.current.getBoundingClientRect();
            startPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top + containerRef.current.scrollTop };
            setSelectionBox({ x: startPos.current.x, y: startPos.current.y, w: 0, h: 0 });
        }
    };

    // 對應 EmployeeList: handleContainerMouseMove
    const handleContainerMouseMove = (e: React.MouseEvent) => {
        if (isBoxSelecting.current && startPos.current && containerRef.current) {
            hasDragged.current = true;
            const rect = containerRef.current.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top + containerRef.current.scrollTop;

            const x = Math.min(currentX, startPos.current.x);
            const y = Math.min(currentY, startPos.current.y);
            const w = Math.abs(currentX - startPos.current.x);
            const h = Math.abs(currentY - startPos.current.y);
            setSelectionBox({ x, y, w, h });

            // 碰撞檢測
            const rows = containerRef.current.querySelectorAll('tr[data-id]');
            const newPreviewIds: number[] = [];

            const boxRect = {
                left: rect.left + x,
                top: rect.top + (y - containerRef.current.scrollTop),
                right: rect.left + x + w,
                bottom: rect.top + (y - containerRef.current.scrollTop) + h
            };

            rows.forEach(row => {
                const rowRect = row.getBoundingClientRect();
                const rowId = parseInt(row.getAttribute('data-id') || '0');
                const isIntersecting = !(
                    rowRect.right < boxRect.left || rowRect.left > boxRect.right ||
                    rowRect.bottom < boxRect.top || rowRect.top > boxRect.bottom
                );
                if (isIntersecting) newPreviewIds.push(rowId);
            });
            setPreviewIds(newPreviewIds);
        }
    };

    // 全域 MouseUp
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (previewIds.length > 0) {
                const newSet = new Set(selectedIds);
                previewIds.forEach(id => {
                    if (newSet.has(id)) newSet.delete(id);
                    else newSet.add(id);
                });
                setSelectedIds(Array.from(newSet));
            } else if (rowDragStartId !== null) {
                const newSet = new Set(selectedIds);
                if (newSet.has(rowDragStartId)) newSet.delete(rowDragStartId);
                else newSet.add(rowDragStartId);
                setSelectedIds(Array.from(newSet));
            } else if (!hasDragged.current && isBoxSelecting.current) {
                setSelectedIds([]);
            }

            setRowDragStartId(null);
            isBoxSelecting.current = false;
            setSelectionBox(null);
            setPreviewIds([]);
            setTimeout(() => hasDragged.current = false, 0);
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [previewIds, rowDragStartId, selectedIds, setSelectedIds, setPreviewIds, setRowDragStartId]);

    return {
        selectionBox,
        handleContainerMouseDown,
        handleContainerMouseMove,
        hasDragged
    };
}