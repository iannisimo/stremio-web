import { useEffect, useRef } from 'react';
import { getCurrentFocusKey, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { addKeyInterceptor } from 'stremio/services/Input';
import { BUTTONS_FOCUS_KEY, PLAY_PAUSE_FOCUS_KEY, SEEK_BAR_FOCUS_KEY } from './playerFocusKeys';

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
    playing: boolean,
    // a popup is open (menus or the next video popup)
    popupOpen: boolean,
    seekTimeDuration: number,
    seekShortTimeDuration: number,
    seekBy: (offset: number) => void,
    pause: () => void,
    // restart the auto-hide countdown
    keepControls: () => void,
    // hide them now (only while playing: paused, they stay)
    hideControls: () => void,
    // close the top popup
    closePopup: () => void,
    leave: () => void,
};

const isInside = (root: HTMLElement | null) => {
    const element = document.activeElement;
    return root !== null && element instanceof HTMLElement && element !== root && root.contains(element);
};

// Remote handling for the player. Runs ahead of other key handlers (and
// Norigin), see addKeyInterceptor. With the controls hidden (or nothing in them
// focused): ← / → seek on the seek bar, ↑ goes to the seek bar, ↓ to the
// button row, Enter pauses on Play/Pause. With the controls up, Norigin moves
// focus, ← / → on the seek bar keep seeking, and any key restarts the hide
// timer. Back closes popups, then hides the controls (while playing), then leaves.
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
                // controls up while playing: Back only hides them
                if (!o.overlayHidden && o.playing) {
                    if (!event.repeat) o.hideControls();
                    return true;
                }
                // Escape goes through the 'exit' shortcut (fullscreen aware).
                // Shortcuts don't mark keys handled, so do it here: the Back
                // fallback would otherwise go to Home after the player left.
                if (event.key === 'Escape') {
                    event.preventDefault();
                    return false;
                }
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
                        if (!event.repeat) setFocus(SEEK_BAR_FOCUS_KEY);
                        return true;
                    case 'ArrowUp':
                    case 'ArrowDown':
                        if (!event.repeat) {
                            o.keepControls();
                            setFocus(event.key === 'ArrowUp' ? SEEK_BAR_FOCUS_KEY : BUTTONS_FOCUS_KEY);
                        }
                        return true;
                    case 'Enter':
                        // the same press must not also click Play/Pause
                        swallowEnter.current = true;
                        if (!event.repeat) {
                            o.pause();
                            o.keepControls();
                            setFocus(PLAY_PAUSE_FOCUS_KEY);
                        }
                        return true;
                    default:
                        return false;
                }
            }

            if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && getCurrentFocusKey() === SEEK_BAR_FOCUS_KEY) {
                seek(event, event.key === 'ArrowLeft' ? -1 : 1);
                return true;
            }

            if (event.key === 'Enter' && swallowEnter.current) return true;
            o.keepControls();
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
