import React from 'react';
import { useTranslation } from 'react-i18next';
import useProfile from 'stremio/common/useProfile';
import TvNotice from 'stremio/components/TvNotice';
import styles from './TvAddonsNotice.less';

// Shown in place of the addons list: managing addons with a remote is
// painful, and they sync from any other Stremio through the account.
// focusKey: the log-in button's container, shown only when logged out
const TvAddonsNotice = ({ focusKey }: { focusKey?: string }) => {
    const { t } = useTranslation();
    const profile = useProfile();

    if (profile.auth === null) {
        return (
            <TvNotice
                focusKey={focusKey}
                icon={'addons-outline'}
                title={'Log in to get your addons'}
                message={'Addons follow your Stremio account. Log in here, then manage them on the web or on your phone.'}
                points={[
                    { icon: 'cloud-sync', text: 'Addons sync to this TV from any device' },
                    { icon: 'cloud-library', text: t('NOT_LOGGED_IN_CLOUD') },
                ]}
                actions={[{ label: t('LOG_IN'), href: '#/intro' }]}
            />
        );
    }

    return (
        <TvNotice
            icon={'addons-outline'}
            title={'Manage addons on another device'}
            message={'Install, remove and configure addons from Stremio on the web or on your phone. They sync to this TV through your Stremio account.'}
            side={<img className={styles['qrcode']} src={require('/assets/images/web_addons_qr.svg')} alt={''} />}
        >
            <div className={styles['url']}>web.stremio.com</div>
        </TvNotice>
    );
};

export default TvAddonsNotice;
