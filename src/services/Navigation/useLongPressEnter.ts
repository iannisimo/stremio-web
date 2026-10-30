import { useCallback, useEffect, useRef } from 'react';

const LONG_PRESS_MS = 500;

// Short Enter press clicks the focused element as usual; holding Enter (or a
// right click) calls onLongPress with it instead. Spread the returned handlers
// on a container.
const useLongPressEnter = (onLongPress: (target: HTMLElement) => void) => {
    const timer = useRef<number | null>(null);
    const target = useRef<HTMLElement | null>(null);
    const fired = useRef(false);

    const clear = () => {
        if (timer.current !== null) clearTimeout(timer.current);
        timer.current = null;
    };

    const onKeyDownCapture = useCallback((event: React.KeyboardEvent) => {
        if (event.key !== 'Enter' || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.repeat || timer.current !== null) return;
        target.current = event.target as HTMLElement;
        fired.current = false;
        timer.current = window.setTimeout(() => {
            timer.current = null;
            fired.current = true;
            if (target.current) onLongPress(target.current);
        }, LONG_PRESS_MS);
    }, [onLongPress]);

    const onKeyUpCapture = useCallback((event: React.KeyboardEvent) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        event.stopPropagation();
        const element = target.current;
        const wasLong = fired.current;
        clear();
        target.current = null;
        fired.current = false;
        if (!wasLong && element) element.click();
    }, []);

    const onBlurCapture = useCallback(() => {
        clear();
        target.current = null;
    }, []);

    const onContextMenu = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        onLongPress(event.target as HTMLElement);
    }, [onLongPress]);

    useEffect(() => clear, []);

    return { onKeyDownCapture, onKeyUpCapture, onBlurCapture, onContextMenu };
};

export default useLongPressEnter;
