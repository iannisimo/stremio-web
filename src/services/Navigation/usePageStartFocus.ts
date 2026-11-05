import { useEffect, useRef } from 'react';
import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useRouteActive } from 'stremio/common/useRouteFocused';

type Keys = {
    enabled: boolean,
    // the page's first focus; without one the page always opens on fallbackFocusKey
    startFocusKey?: string,
    // where coming back goes: a container that remembers its last child
    returnFocusKey: string,
    fallbackFocusKey: string,
};

// Each time the page comes on top. Until it has been left: its start target,
// which takes focus when it mounts if it isn't there yet. After that: the
// return container, so focus goes back to where it was left.
const usePageStartFocus = ({ enabled, startFocusKey, returnFocusKey, fallbackFocusKey }: Keys) => {
    const routeActive = useRouteActive();
    const left = useRef(false);

    useEffect(() => {
        if (!enabled) return;
        if (!routeActive) {
            left.current = true;
            return;
        }
        if (typeof startFocusKey !== 'string') {
            setFocus(fallbackFocusKey);
        } else {
            setFocus(left.current ? returnFocusKey : startFocusKey);
        }
    }, [enabled, routeActive]);
};

export default usePageStartFocus;
