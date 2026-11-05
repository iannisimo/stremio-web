import { useCallback, useRef } from 'react';
import usePlayerKeys from './usePlayerKeys';

type Options = {
    routeFocused: boolean,
    playerRef: React.RefObject<HTMLElement>,
    overlayHidden: boolean,
    paused: boolean | null,
    menusOpen: boolean,
    nextVideoPopupOpen: boolean,
    // which popup is open
    openMenu: 'subtitles' | 'audio' | 'speed' | 'statistics' | 'episodes' | null,
    seekTimeDuration: number,
    seekShortTimeDuration: number,
    seekBy: (offset: number) => void,
    pause: () => void,
    setImmersed: (value: boolean) => void,
    setImmersedDebounced: ((value: boolean) => void) & { cancel: () => void },
    closeMenus: () => void,
    dismissNextVideoPopup: () => void,
    goBack: () => void,
};

// Remote control for the player: hidden-controls keys and Back closing popups.
// See usePlayerKeys.
const useTvPlayer = (options: Options) => {
    const latest = useRef(options);
    latest.current = options;

    const showControls = useCallback(() => {
        latest.current.setImmersed(false);
        latest.current.setImmersedDebounced(true);
    }, []);

    const hideControls = useCallback(() => {
        latest.current.setImmersedDebounced.cancel();
        latest.current.setImmersed(true);
    }, []);

    const closePopup = useCallback(() => {
        const o = latest.current;
        if (o.openMenu === null && o.nextVideoPopupOpen) {
            o.dismissNextVideoPopup();
        } else {
            o.closeMenus();
        }
    }, []);

    usePlayerKeys({
        active: options.routeFocused,
        playerRef: options.playerRef,
        overlayHidden: options.overlayHidden,
        playing: options.paused === false,
        popupOpen: options.menusOpen,
        seekTimeDuration: options.seekTimeDuration,
        seekShortTimeDuration: options.seekShortTimeDuration,
        seekBy: options.seekBy,
        pause: options.pause,
        keepControls: showControls,
        hideControls,
        closePopup,
        leave: options.goBack,
    });
};

export default useTvPlayer;
