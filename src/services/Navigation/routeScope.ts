import React from 'react';

// Focus key of the route a component renders in. Hidden routes stay mounted,
// so keys that every route uses (the sidebar) are prefixed with it.
const RouteScopeContext = React.createContext('');

export const RouteScopeProvider = RouteScopeContext.Provider;
export const useRouteScope = () => React.useContext(RouteScopeContext);
