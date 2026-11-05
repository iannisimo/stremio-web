import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentFocusKey, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useRouteActive } from 'stremio/common/useRouteFocused';

const BACK_KEYS = ['Escape', 'Backspace', 'BrowserBack'];

// Back that nothing else handled (dialogs, pages and players take it first, in
// the capture phase): from the content to the current rail tab, from the rail
// to Home. Pages without a rail fall back to `backFallback`.
type Options = {
    enabled: boolean,
    railFocusKey: string,
    isHome: boolean,
};

const useRailBack = ({ enabled, railFocusKey, isHome }: Options) => {
    const routeActive = useRouteActive();
    const navigate = useNavigate();

    useEffect(() => {
        if (!enabled || !routeActive) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (!BACK_KEYS.includes(event.key) || event.defaultPrevented || event.repeat) return;
            // Backspace edits text fields
            if (event.target instanceof HTMLElement && event.target.matches('input, textarea, [data-text-entry]')) return;
            if (document.querySelector('.modals-container > .modal-container')) return;
            const current = getCurrentFocusKey();
            const onRail = typeof current === 'string' && current.startsWith(`${railFocusKey}:`);
            if (!onRail) {
                event.preventDefault();
                setFocus(railFocusKey);
            } else if (!isHome) {
                event.preventDefault();
                navigate('/');
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [enabled, routeActive, railFocusKey, isHome]);
};

export default useRailBack;
