import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouteActive } from 'stremio/common/useRouteFocused';
import TvFullscreenDialog from 'stremio/components/TvFullscreenDialog';
import { getRequest, subscribe } from './store';

// the page may never focus anything (an error screen)
const PAGE_FOCUS_TIMEOUT = 2000;

// Waits until the page has taken its start focus, so the page doesn't take
// it from the dialog and closing the dialog goes back there.
const usePageFocused = (enabled: boolean) => {
    const [focused, setFocused] = useState(false);
    useEffect(() => {
        if (!enabled || focused) return;
        if (document.activeElement !== null && document.activeElement !== document.body) {
            setFocused(true);
            return;
        }
        const onFocusIn = () => setFocused(true);
        const timeout = setTimeout(onFocusIn, PAGE_FOCUS_TIMEOUT);
        document.addEventListener('focusin', onFocusIn);
        return () => {
            clearTimeout(timeout);
            document.removeEventListener('focusin', onFocusIn);
        };
    }, [enabled, focused]);
    return focused;
};

const TvServerUrlSlot = () => {
    const { t } = useTranslation();
    const routeActive = useRouteActive();
    const request = useSyncExternalStore(subscribe, getRequest);
    const pageFocused = usePageFocused(routeActive && request !== null);

    const actions = useMemo(() => request === null ? [] : [
        { label: t('BUTTON_CONFIRM'), onClick: request.onConfirm },
        { label: t('BUTTON_CANCEL'), onClick: request.onCancel },
    ], [t, request]);

    if (!routeActive || request === null || !pageFocused) return null;

    return (
        <TvFullscreenDialog
            icon={'network'}
            title={t('SETTINGS_SERVER_CONFIGURE_TITLE')}
            message={request.url}
            actions={actions}
            onClose={request.onCancel}
        />
    );
};

export default TvServerUrlSlot;
