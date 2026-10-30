import { useEffect } from 'react';

type Emit = (event: string, data?: string) => boolean;

const DIRECTIONS: Record<string, string> = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
};

const isTextInput = (element: Element | null) => {
    if (!(element instanceof HTMLElement)) return false;
    if (element.isContentEditable || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') return true;
    if (element.tagName !== 'INPUT') return false;
    const type = (element as HTMLInputElement).type;
    return !['checkbox', 'radio', 'range', 'button', 'submit'].includes(type);
};

// Maps keyboard / remote keys to the gamepad events, so the existing
// gamepad navigation handlers drive focus.
const useRemoteKeyboard = (enabled: boolean, emit: Emit) => {
    useEffect(() => {
        if (!enabled) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.isComposing) return;
            if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;

            const typing = isTextInput(document.activeElement);
            const direction = DIRECTIONS[event.key];

            let handled = false;
            if (direction) {
                // left/right move the caret while typing
                if (typing && (direction === 'left' || direction === 'right')) return;
                handled = emit('analog', direction);
            } else if (event.key === 'Enter') {
                if (typing) return;
                handled = emit('buttonA');
            }

            if (handled) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        };

        window.addEventListener('keydown', onKeyDown, true);
        return () => {
            window.removeEventListener('keydown', onKeyDown, true);
        };
    }, [enabled, emit]);
};

export default useRemoteKeyboard;
