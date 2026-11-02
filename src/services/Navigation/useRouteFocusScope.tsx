import React from 'react';
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import useFocusGroup from './useFocusGroup';
import { RouteScopeProvider } from './routeScope';

// Focus group for one route. Routes below the top one stay mounted but
// hidden; their group stops taking focus so arrows never land on them.
const useRouteFocusScope = (view: number, focused: boolean) => {
    const group = useFocusGroup<HTMLDivElement>({ focusKey: `route-${view}`, focusable: focused });
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
