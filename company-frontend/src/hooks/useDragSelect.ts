// hooks/useDragSelect.ts
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
    containerRef, selectedIds, setSelectedIds, setPreviewIds, previewIds, rowDragStartId, setRowDragStartId
}: UseDragSelectProps) {
    const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const isBoxSelecting = useRef(false);
    const hasDragged = useRef(false);
    const startPos = useRef<{ x: number, y: number } | null>(null);

    const handleContainerMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) return;

        if (e.button === 0 && containerRef.current) {
            isBoxSelecting.current = true;
            hasDragged.current = false;
            setPreviewIds([]);

            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left - (containerRef.current.clientLeft || 0);
            const y = e.clientY - rect.top - (containerRef.current.clientTop || 0) + containerRef.current.scrollTop;

            startPos.current = { x, y };
            setSelectionBox({ x, y, w: 0, h: 0 });
        }
    };

    const handleContainerMouseMove = (e: React.MouseEvent) => {
        if (isBoxSelecting.current && startPos.current && containerRef.current) {
            hasDragged.current = true;
            const rect = containerRef.current.getBoundingClientRect();

            const currentX = e.clientX - rect.left - (containerRef.current.clientLeft || 0);
            const currentY = e.clientY - rect.top - (containerRef.current.clientTop || 0) + containerRef.current.scrollTop;

            const x = Math.min(currentX, startPos.current.x);
            const y = Math.min(currentY, startPos.current.y);
            const w = Math.abs(currentX - startPos.current.x);
            const h = Math.abs(currentY - startPos.current.y);
            setSelectionBox({ x, y, w, h });

            // 碰撞檢測：使用 Viewport 座標比較最準確
            const rows = containerRef.current.querySelectorAll('[data-id]');
            const newPreviewIds: number[] = [];
            const boxViewportRect = {
                left: rect.left + (containerRef.current.clientLeft || 0) + x,
                top: rect.top + (containerRef.current.clientTop || 0) + (y - containerRef.current.scrollTop),
                right: rect.left + (containerRef.current.clientLeft || 0) + x + w,
                bottom: rect.top + (containerRef.current.clientTop || 0) + (y - containerRef.current.scrollTop) + h
            };

            rows.forEach((row: Element) => {
                const rowRect = row.getBoundingClientRect();
                const rowId = parseInt(row.getAttribute('data-id') || '0');
                if (!(rowRect.right < boxViewportRect.left || rowRect.left > boxViewportRect.right ||
                    rowRect.bottom < boxViewportRect.top || rowRect.top > boxViewportRect.bottom)) {
                    newPreviewIds.push(rowId);
                }
            });
            setPreviewIds(newPreviewIds);
        }
    };

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            // 只有在真的有在進行框選或拖選動作時才處理
            if (!isBoxSelecting.current && rowDragStartId === null) return;

            const newSet = new Set(selectedIds);

            // 1. 處理框選或 Shift 滑選的預覽 ID
            if (previewIds.length > 0) {
                previewIds.forEach((id) => {
                    if (newSet.has(id)) newSet.delete(id);
                    else newSet.add(id);
                });
            }
            // 2. 處理單純點擊（沒有拖拽動作）
            else if (rowDragStartId !== null && !hasDragged.current) {
                if (newSet.has(rowDragStartId)) newSet.delete(rowDragStartId);
                else newSet.add(rowDragStartId);
            }
            // 3. 點擊空白處（沒拖拽且沒選到東西）
            else if (isBoxSelecting.current && !hasDragged.current) {
                newSet.clear();
            }

            setSelectedIds(Array.from(newSet));

            // 重置所有狀態
            setRowDragStartId(null);
            isBoxSelecting.current = false;
            setSelectionBox(null);
            setPreviewIds([]);
            setTimeout(() => { hasDragged.current = false; }, 0);
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [previewIds, rowDragStartId, selectedIds, setSelectedIds, setPreviewIds, setRowDragStartId]);

    return { selectionBox, handleContainerMouseDown, handleContainerMouseMove, hasDragged };
}