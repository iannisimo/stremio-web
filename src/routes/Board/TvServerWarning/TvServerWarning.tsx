import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCore } from 'stremio/core';
import useProfile from 'stremio/common/useProfile';
import { withCoreSuspender } from 'stremio/common/CoreSuspender';
import FullscreenDialog from 'stremio/components/FullscreenDialog';

const createDismissalDate = (months: number, years = 0): Date => {
    const dismissalDate = new Date();
    if (months) dismissalDate.setMonth(dismissalDate.getMonth() + months);
    if (years) dismissalDate.setFullYear(dismissalDate.getFullYear() + years);
    return dismissalDate;
};

const TvServerWarning = () => {
    const { t } = useTranslation();
    const core = useCore();
    const profile = useProfile();

    const updateSettings = useCallback((streamingServerWarningDismissed: Date) => {
        core.transport.dispatch({
            action: 'Ctx',
            args: {
                action: 'UpdateSettings',
                args: {
                    ...profile.settings,
                    streamingServerWarningDismissed
                }
            }
        });
    }, [profile.settings]);

    const onLater = useCallback(() => {
        updateSettings(createDismissalDate(1));
    }, [updateSettings]);

    const onDismiss = useCallback(() => {
        updateSettings(createDismissalDate(0, 50));
    }, [updateSettings]);

    const actions = useMemo(() => [
        { label: t('WARNING_STREAMING_SERVER_LATER'), onClick: onLater },
        { label: t('SERVICE_INSTALL'), href: 'https://www.stremio.com/download-service', target: '_blank' },
        { label: t('DONT_SHOW_AGAIN'), onClick: onDismiss },
    ], [t, onLater, onDismiss]);

    return (
        <FullscreenDialog
            icon={'warning'}
            title={t('SETTINGS_SERVER_UNAVAILABLE')}
            message={'Most streams need the streaming server. Start it on this device, or set a remote server in Settings → Streaming.'}
            actions={actions}
            onClose={onLater}
        />
    );
};

export default withCoreSuspender(TvServerWarning);
