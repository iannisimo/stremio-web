import React from 'react';
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import useFocusGroup from './useFocusGroup';
import { RouteScopeProvider } from './routeScope';
import { focusRoute } from './navigation';

// Focus group for one route. Routes below the top one stay mounted but
// hidden; their group stops taking focus so arrows never land on them.
const useRouteFocusScope = (view: number, focused: boolean) => {
    const group = useFocusGroup<HTMLDivElement>({ focusKey: `route-${view}`, focusable: focused });
    // the page on top takes focus right away; coming back, where it was
    const shown = React.useRef(false);
    React.useEffect(() => {
        if (!focused) return;
        const restore = shown.current;
        shown.current = true;
        return focusRoute(group.focusKey, restore);
    }, [focused, group.focusKey]);
    const Provider = React.useCallback(({ children }: { children: React.ReactNode }) => (
        <FocusContext.Provider value={group.focusKey}>
            <RouteScopeProvider value={group.focusKey}>
                {children}
            </RouteScopeProvider>
        </FocusContext.Provider>
    ), [group.focusKey]);
    return { ref: group.ref, Provider };
};

export default useRouteFocusScope;
