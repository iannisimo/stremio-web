import React from 'react';
import { useTranslation } from 'react-i18next';
import TvNotice from 'stremio/components/TvNotice';

// Upstream's Placeholder texts in the TV notice.
const TvPlaceholder = ({ focusKey }: { focusKey?: string }) => {
    const { t } = useTranslation();
    return (
        <TvNotice
            focusKey={focusKey}
            icon={'calendar-outline'}
            title={t('CALENDAR_NOT_LOGGED_IN')}
            points={[
                { icon: 'megaphone', text: t('NOT_LOGGED_IN_NOTIFICATIONS') },
                { icon: 'calendar-thin', text: t('NOT_LOGGED_IN_CALENDAR') },
            ]}
            actions={[{ label: t('LOG_IN'), href: '#/intro' }]}
        />
    );
};

export default TvPlaceholder;
