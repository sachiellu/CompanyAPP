// src/hooks/useZoomPan.ts
import { useState, useEffect, useCallback, useRef } from 'react';

export function useZoomPan() {
    const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
    const [elastic, setElastic] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const dragStart = useRef({ x: 0, y: 0 });

    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        const zoomSpeed = 0.1;
        const delta = e.deltaY > 0 ? (1 - zoomSpeed) : (1 + zoomSpeed);
        const newScale = Math.min(Math.max(0.5, view.scale * delta), 3);

        if (newScale !== view.scale) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // 智慧縮放公式
            const xs = (mouseX - view.x) / view.scale;
            const ys = (mouseY - view.y) / view.scale;

            setView({
                x: mouseX - xs * newScale,
                y: mouseY - ys * newScale,
                scale: newScale
            });
        }
    }, [view]);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'BUTTON') return;

        setIsDragging(true);
        dragStart.current = { x: e.clientX - elastic.x, y: e.clientY - elastic.y };
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
    }, [elastic]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        setElastic({
            x: Math.max(Math.min(e.clientX - dragStart.current.x, 200), -200),
            y: Math.max(Math.min(e.clientY - dragStart.current.y, 200), -200)
        });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setElastic({ x: 0, y: 0 });
        document.body.style.userSelect = 'auto';
        document.body.style.cursor = 'default';
    }, []);

    const resetAll = () => {
        setView({ x: 0, y: 0, scale: 1 });
        setElastic({ x: 0, y: 0 });
    };

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            el.removeEventListener('wheel', handleWheel);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleWheel, handleMouseMove, handleMouseUp, handleMouseDown]);

    return { view, elastic, containerRef, isDragging, resetAll };
}