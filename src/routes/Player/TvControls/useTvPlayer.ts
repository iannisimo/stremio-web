import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { getCurrentFocusKey, setFocus } from 'stremio/services/Navigation';
import usePlayerKeys from './usePlayerKeys';

const OPENER_KEYS = /^player-(play|next|statistics|speed|subtitles|audio|episodes|scale|drawer-button)$/;

type Options = {
    routeFocused: boolean,
    playerRef: React.RefObject<HTMLElement>,
    controlBarRef: React.RefObject<HTMLElement>,
    overlayHidden: boolean,
    menusOpen: boolean,
    nextVideoPopupOpen: boolean,
    // which popup is open, to find the button that opened it
    openMenu: 'subtitles' | 'audio' | 'speed' | 'statistics' | 'episodes' | null,
    seekTimeDuration: number,
    seekShortTimeDuration: number,
    seekBy: (offset: number) => void,
    setImmersed: (value: boolean) => void,
    setImmersedDebounced: (value: boolean) => void,
    closeMenus: () => void,
    dismissNextVideoPopup: () => void,
    goBack: () => void,
};

// Remote control for the player: hidden-controls keys, Back closing popups and
// putting focus back where it came from. See usePlayerKeys.
const useTvPlayer = (options: Options) => {
    const { playerRef, controlBarRef, overlayHidden, menusOpen } = options;
    const latest = useRef(options);
    latest.current = options;
    const opener = useRef<string | null>(null);
    const wasOpen = useRef(false);

    const showControls = useCallback(() => {
        latest.current.setImmersed(false);
        latest.current.setImmersedDebounced(true);
    }, []);

    const restoreFocus = useCallback((key: string | null) => {
        showControls();
        setTimeout(() => {
            if (key !== null) {
                setFocus(key);
            } else if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        }, 0);
    }, [showControls]);

    // focus goes back to the opener once the popup is gone, see below
    const closePopup = useCallback(() => {
        const o = latest.current;
        opener.current ??= o.openMenu !== null ? `player-${o.openMenu}` : null;
        if (o.openMenu === null && o.nextVideoPopupOpen) {
            o.dismissNextVideoPopup();
        } else {
            o.closeMenus();
        }
    }, []);

    usePlayerKeys({
        active: options.routeFocused,
        playerRef,
        overlayHidden,
        popupOpen: menusOpen,
        seekTimeDuration: options.seekTimeDuration,
        seekShortTimeDuration: options.seekShortTimeDuration,
        seekBy: options.seekBy,
        keepControls: showControls,
        closePopup,
        leave: options.goBack,
    });

    // controls fade out: drop focus so the next key takes the hidden path
    useEffect(() => {
        const focused = document.activeElement;
        if (overlayHidden && focused instanceof HTMLElement && focused !== playerRef.current && playerRef.current?.contains(focused)) {
            focused.blur();
        }
    }, [overlayHidden, playerRef]);

    // remember the opening button; if a popup closes by itself, keep the remote on the player
    useLayoutEffect(() => {
        if (menusOpen && !wasOpen.current) {
            const key = getCurrentFocusKey();
            opener.current = OPENER_KEYS.test(key) && playerRef.current?.contains(document.activeElement) ? key : null;
        } else if (!menusOpen && wasOpen.current) {
            const key = opener.current;
            opener.current = null;
            if (document.documentElement.dataset.input === 'keyboard' && !controlBarRef.current?.contains(document.activeElement)) {
                restoreFocus(key);
            }
        }
        wasOpen.current = menusOpen;
    }, [menusOpen, playerRef, controlBarRef, restoreFocus]);
};

export default useTvPlayer;
