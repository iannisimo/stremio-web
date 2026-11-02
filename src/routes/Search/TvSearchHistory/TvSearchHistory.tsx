import React from 'react';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import Icon from '@stremio/stremio-icons/react';
import Button from 'stremio/components/Button';
import { FocusContext, useFocusGroup, useRouteScope } from 'stremio/services/Navigation';
import styles from './TvSearchHistory.less';

// JS module without types
const useSearchHistory = require('stremio/components/NavBar/HorizontalNavBar/SearchBar/useSearchHistory');

const HISTORY_SIZE = 12;

// Search history on the page, in place of the top bar's popup.
const TvSearchHistory = () => {
    const { t } = useTranslation();
    const scope = useRouteScope();
    const searchHistory = useSearchHistory();
    const items: { query: string, deepLinks: { search: string } }[] = searchHistory.items ?? [];
    // coming down from the wide search field lands on the first chip, not the nearest
    const firstKey = `${scope}-history-0`;
    const group = useFocusGroup<HTMLDivElement>({ preferredChildFocusKey: firstKey, saveLastFocusedChild: false });

    if (items.length === 0) {
        return <div className={styles['hint']}>{t('SEARCH_ANYTHING')}</div>;
    }

    return (
        <div className={styles['tv-search-history']}>
            <div className={styles['title']}>{t('STREMIO_TV_SEARCH_HISTORY_TITLE')}</div>
            <FocusContext.Provider value={group.focusKey}>
                <div ref={group.ref} className={styles['chips']}>
                    {
                        items.slice(0, HISTORY_SIZE).map(({ query, deepLinks }, index) => (
                            <Button key={index} className={styles['chip']} focusKey={`${scope}-history-${index}`} href={deepLinks.search} title={query}>
                                <Icon className={styles['chip-icon']} name={'search'} />
                                <span className={styles['chip-label']}>{query}</span>
                            </Button>
                        ))
                    }
                    <Button className={classnames(styles['chip'], styles['clear'])} onClick={searchHistory.clear}>
                        {t('CLEAR_HISTORY')}
                    </Button>
                </div>
            </FocusContext.Provider>
        </div>
    );
};

export default TvSearchHistory;
