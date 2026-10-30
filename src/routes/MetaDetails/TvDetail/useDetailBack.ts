import { useEffect, useRef } from 'react';
import useRouteFocused from 'stremio/common/useRouteFocused';
import { setFocus } from 'stremio/services/Navigation';

const BACK_KEYS = ['Escape', 'Backspace', 'BrowserBack'];

// Back for the detail page. Dialogs and text fields get their own Back first.
const useDetailBack = (onBack: () => void) => {
    const routeFocused = useRouteFocused();
    const handler = useRef(onBack);
    handler.current = onBack;

    useEffect(() => {
        if (!routeFocused) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (!BACK_KEYS.includes(event.key)) return;
            if (document.querySelector('.modals-container > .modal-container')) return;
            const target = event.target;
            if (target instanceof HTMLElement && target.matches('input, textarea')) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    target.blur();
                    setFocus('detail-panel');
                }
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            handler.current();
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [routeFocused]);
};

export default useDetailBack;
