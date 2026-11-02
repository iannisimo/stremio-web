import React from 'react';
import { useTranslation } from 'react-i18next';
import TvNotice from 'stremio/components/TvNotice';

// Upstream's Placeholder texts in the TV notice.
const TvPlaceholder = () => {
    const { t } = useTranslation();
    return (
        <TvNotice
            icon={'library-outline'}
            title={t('LIBRARY_NOT_LOGGED_IN')}
            points={[
                { icon: 'cloud-library', text: t('NOT_LOGGED_IN_CLOUD') },
                { icon: 'actors', text: t('NOT_LOGGED_IN_RECOMMENDATIONS') },
            ]}
            actions={[{ label: t('LOG_IN'), href: '#/intro' }]}
        />
    );
};

export default TvPlaceholder;
