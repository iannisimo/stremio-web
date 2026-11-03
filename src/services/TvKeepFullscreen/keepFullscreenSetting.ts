import { useCallback, useSyncExternalStore } from 'react';
import i18n from 'i18next';

const STORAGE_KEY = 'keepFullscreen';

const LABEL_KEY = 'SETTINGS_KEEP_FULLSCREEN';
const ensureLabel = () => {
    if (i18n.isInitialized && !i18n.exists(LABEL_KEY, { lng: 'en-US' })) {
        i18n.addResource('en-US', 'translation', LABEL_KEY, 'Always fullscreen');
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

const setKeepFullscreen = (value: boolean) => {
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

const useKeepFullscreenSetting = (): [boolean, (value: boolean) => void] => {
    ensureLabel();
    const value = useSyncExternalStore(subscribe, getSnapshot);
    const set = useCallback((next: boolean) => setKeepFullscreen(next), []);
    return [value, set];
};

export { LABEL_KEY as KEEP_FULLSCREEN_LABEL, useKeepFullscreenSetting };
