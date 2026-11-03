// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const { useTranslation } = require('react-i18next');
const { useGoBack } = require('stremio-router');
const { HorizontalNavBar, Image } = require('stremio/components');
const { default: useDetailBack } = require('stremio/routes/MetaDetails/TvDetail/useDetailBack');
const styles = require('./styles');

const NotFound = () => {
    const { t } = useTranslation();
    // HTPC fork: the top bar has no back button, the Back key leaves
    useDetailBack(useGoBack());
    return (
        <div className={styles['not-found-container']}>
            <HorizontalNavBar
                className={styles['nav-bar']}
                title={t('PAGE_NOT_FOUND')}
            />
            <div className={styles['not-found-content']}>
                <Image
                    className={styles['not-found-image']}
                    src={require('/assets/images/empty.png')}
                    alt={' '}
                />
                <div className={styles['not-found-label']}>{t('PAGE_NOT_FOUND')}</div>
            </div>
        </div>
    );
};

module.exports = NotFound;
