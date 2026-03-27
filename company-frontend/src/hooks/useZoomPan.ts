import { useState, useEffect, useCallback, useRef } from 'react';

export function useZoomPan() {
    // view 控制縮放與主要位移
    const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
    // parallax 控制視差偏移 (跟隨滑鼠輕微移動)
    const [parallax, setParallax] = useState({ x: 0, y: 0 });

    const containerRef = useRef<HTMLDivElement>(null);

    // 1. 跟隨滑鼠縮放 (Zoom to Point)
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();

        // 設定縮放係數
        const intensity = 0.1;
        const delta = e.deltaY > 0 ? (1 - intensity) : (1 + intensity);

        // 限制縮放範圍 (0.8x ~ 3x)
        const newScale = Math.min(Math.max(0.8, view.scale * delta), 3);

        if (newScale !== view.scale) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;

            // 取得滑鼠在容器內的座標
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // 數學魔法：計算新的 X, Y，讓滑鼠指的地方保持不動
            // 公式：NewX = MouseX - (MouseX - OldX) * (NewScale / OldScale)
            const newX = mouseX - (mouseX - view.x) * (newScale / view.scale);
            const newY = mouseY - (mouseY - view.y) * (newScale / view.scale);

            setView({
                x: newX,
                y: newY,
                scale: newScale
            });
        }
    }, [view]);

    // 2. 視差效果 (Parallax) - 計算滑鼠距離中心的偏移
    const handleMouseMove = useCallback((e: MouseEvent) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // 計算偏移量，數值越小，移動越輕微 (這裡設為 / 25)
        const moveX = (e.clientX - centerX) / 25;
        const moveY = (e.clientY - centerY) / 25;

        setParallax({ x: moveX, y: moveY });
    }, []);

    // 3. 雙擊還原
    const resetAll = () => {
        setView({ x: 0, y: 0, scale: 1 });
    };

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        // 綁定事件
        el.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            el.removeEventListener('wheel', handleWheel);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [handleWheel, handleMouseMove]);

    return { view, parallax, containerRef, resetAll };
}