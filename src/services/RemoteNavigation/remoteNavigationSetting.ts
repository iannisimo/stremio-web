import { useCallback, useSyncExternalStore } from 'react';
import i18n from 'i18next';

const STORAGE_KEY = 'remoteNavigation';

// TODO: move to stremio-translations
const LABEL_KEY = 'SETTINGS_REMOTE_NAVIGATION';
const ensureLabel = () => {
    if (i18n.isInitialized && !i18n.exists(LABEL_KEY, { lng: 'en-US' })) {
        i18n.addResource('en-US', 'translation', LABEL_KEY, 'Remote / D-pad navigation');
    }
};

const listeners = new Set<() => void>();

const read = (): boolean => {
    try {
        return window.localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
};

let enabled = read();

const notify = () => listeners.forEach((listener) => listener());

const setRemoteNavigationEnabled = (value: boolean) => {
    enabled = value;
    try {
        window.localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
        // storage unavailable, keep the in-memory value
    }
    notify();
};

window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
        enabled = read();
        notify();
    }
});

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

const getSnapshot = () => enabled;

const isRemoteNavigationEnabled = getSnapshot;

const useRemoteNavigationSetting = (): [boolean, (value: boolean) => void] => {
    ensureLabel();
    const value = useSyncExternalStore(subscribe, getSnapshot);
    const set = useCallback((next: boolean) => setRemoteNavigationEnabled(next), []);
    return [value, set];
};

export {
    LABEL_KEY as REMOTE_NAVIGATION_LABEL,
    isRemoteNavigationEnabled,
    setRemoteNavigationEnabled,
    useRemoteNavigationSetting,
};
