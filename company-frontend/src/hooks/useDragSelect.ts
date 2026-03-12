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
        // 排除掉按鈕、連結、輸入框
        if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) return;

        // 🔥 修正 1：移除按鍵限制，只要是左鍵 (button === 0) 就可以啟動框選
        if (e.button === 0 && containerRef.current) {

            // 如果點在卡片上，不啟動框選，交給卡片自己的 MouseDown 處理
            if (target.closest('.card')) return;

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
        const handleGlobalMouseUp = (e: MouseEvent) => {

            // 如果只是單純點擊（沒拖曳），且不是在框選模式，直接退出
            if (!isBoxSelecting.current && rowDragStartId === null) return;

            // 如果是點擊空白處（沒拖曳），清空選取
            if (isBoxSelecting.current && !hasDragged.current) {
                setSelectedIds([]); // 清空
                // 重置狀態
                isBoxSelecting.current = false;
                setSelectionBox(null);
                setPreviewIds([]);
                setRowDragStartId(null);
                return;
            }

            // 判斷按鍵
            const isModifier = e.ctrlKey || e.metaKey || e.shiftKey;
            let newSet: Set<number>;

            // 🔥 修正 2：邏輯分流
            if (!isModifier && previewIds.length > 0) {
                // 情境 A：沒按功能鍵 -> "取代" (只選框框裡的，舊的丟掉)
                newSet = new Set(previewIds);
            } else {
                // 情境 B：有按功能鍵 -> "疊加/反選" (保留舊的 + 框框裡的運算)
                newSet = new Set(selectedIds);
                previewIds.forEach((id) => {
                    if (newSet.has(id)) newSet.delete(id);
                    else newSet.add(id);
                });
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