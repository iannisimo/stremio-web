import { createContext, useContext } from 'react';

// True inside a Suspense fallback. Core suspends a page whenever it asks for a
// model that isn't loaded yet, even after it has mounted: the fallback then
// renders next to the hidden page, and must not take its focus keys or focus.
const SuspenseFallbackContext = createContext(false);

export const SuspenseFallbackProvider = SuspenseFallbackContext.Provider;

export const useInSuspenseFallback = () => useContext(SuspenseFallbackContext);
