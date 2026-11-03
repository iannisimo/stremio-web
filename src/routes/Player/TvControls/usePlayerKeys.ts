import { useEffect, useRef } from 'react';
import { doesFocusableExist } from '@noriginmedia/norigin-spatial-navigation';
import { addKeyInterceptor, getCurrentFocusKey, setFocus } from 'stremio/services/Navigation';

const BACK_KEYS = ['Escape', 'Backspace', 'BrowserBack'];
const REPEAT_MS = 130;
// holding left/right: normal steps at first, then twice as big every second
const HOLD_DELAY_MS = 500;
const HOLD_MAX_FACTOR = 16;

const holdFactor = (heldMs: number) => Math.min(2 ** Math.max(0, (heldMs - HOLD_DELAY_MS) / 1000), HOLD_MAX_FACTOR);

type Options = {
    active: boolean,
    playerRef: React.RefObject<HTMLElement>,
    overlayHidden: boolean,
    // a popup is open (menus or the next video popup)
    popupOpen: boolean,
    seekTimeDuration: number,
    seekShortTimeDuration: number,
    seekBy: (offset: number) => void,
    // restart the auto-hide countdown
    keepControls: () => void,
    // close the top popup and put focus back on its button
    closePopup: () => void,
    leave: () => void,
};

// The seek bar's center sits right of most buttons, so spatial navigation
// would jump to it: step through the button row in DOM order instead.
const stepButtons = (root: HTMLElement, direction: number) => {
    const focused = document.activeElement;
    const buttons = Array.from(root.querySelectorAll<HTMLElement>('[class*="control-bar-buttons-container-"] [class*="control-bar-button-"]'))
        .filter((button) => button.offsetParent !== null && !button.classList.contains('disabled'));
    const index = buttons.findIndex((button) => button === focused);
    if (index === -1) return false;
    buttons[index + direction]?.focus();
    return true;
};

const isInside = (root: HTMLElement | null) => {
    const element = document.activeElement;
    return root !== null && element instanceof HTMLElement && element !== root && root.contains(element);
};

// Remote handling for the player. Runs ahead of the navigation, see
// addKeyInterceptor: hidden controls seek on left/right and wake on up/down/Enter,
// visible controls restart the hide timer, Back closes popups before it leaves.
const usePlayerKeys = (options: Options) => {
    const latest = useRef(options);
    latest.current = options;
    const lastSeek = useRef(0);
    const holdStart = useRef(0);
    const swallowEnter = useRef(false);

    useEffect(() => {
        const seek = (event: KeyboardEvent, direction: number) => {
            const o = latest.current;
            const now = Date.now();
            if (!event.repeat) holdStart.current = now;
            if (event.repeat && now - lastSeek.current < REPEAT_MS) return;
            lastSeek.current = now;
            const step = event.shiftKey ? o.seekShortTimeDuration : o.seekTimeDuration;
            o.seekBy(direction * step * holdFactor(now - holdStart.current));
        };

        const removeInterceptor = addKeyInterceptor((event) => {
            const o = latest.current;
            if (!o.active || event.ctrlKey || event.metaKey || event.altKey) return false;
            const target = event.target;
            if (target instanceof HTMLElement && target.matches('input, textarea, select')) return false;

            if (BACK_KEYS.includes(event.key)) {
                if (o.popupOpen) {
                    if (!event.repeat) o.closePopup();
                    return true;
                }
                // Escape goes through the 'exit' shortcut (fullscreen aware)
                if (event.key === 'Escape') return false;
                if (!event.repeat) o.leave();
                return true;
            }

            if (o.popupOpen) {
                o.keepControls();
                return false;
            }

            const inControls = !o.overlayHidden && isInside(o.playerRef.current);
            if (!inControls) {
                switch (event.key) {
                    case 'ArrowLeft':
                    case 'ArrowRight':
                        seek(event, event.key === 'ArrowLeft' ? -1 : 1);
                        return true;
                    case 'ArrowUp':
                    case 'ArrowDown':
                    case 'Enter':
                        if (event.key === 'Enter') swallowEnter.current = true;
                        if (!event.repeat) {
                            o.keepControls();
                            setTimeout(() => setFocus('player-play'), 0);
                        }
                        return true;
                    default:
                        return false;
                }
            }

            if (event.key === 'Enter' && swallowEnter.current) return true;
            o.keepControls();
            if (getCurrentFocusKey() === 'player-seek') {
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                    seek(event, event.key === 'ArrowLeft' ? -1 : 1);
                    return true;
                }
                if (event.key === 'ArrowDown' && doesFocusableExist('player-play')) {
                    setFocus('player-play');
                    return true;
                }
            }
            const buttonsRow = document.activeElement?.closest('[class*="control-bar-buttons-container-"]');
            if (buttonsRow && (event.key === 'ArrowLeft' || event.key === 'ArrowRight') && o.playerRef.current) {
                return stepButtons(o.playerRef.current, event.key === 'ArrowLeft' ? -1 : 1);
            }
            // the bar touches the row, which spatial navigation doesn't count as above
            if (buttonsRow && event.key === 'ArrowUp' && doesFocusableExist('player-seek')) {
                setFocus('player-seek');
                return true;
            }
            return false;
        });

        const onKeyUp = (event: KeyboardEvent) => {
            if (event.key === 'Enter') swallowEnter.current = false;
        };
        window.addEventListener('keyup', onKeyUp, true);

        return () => {
            removeInterceptor();
            window.removeEventListener('keyup', onKeyUp, true);
        };
    }, []);
};

export default usePlayerKeys;
