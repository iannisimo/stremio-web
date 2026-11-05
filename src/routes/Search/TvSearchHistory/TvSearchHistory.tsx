import React from 'react';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import Icon from '@stremio/stremio-icons/react';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import Button from 'stremio/components/Button';
import styles from './TvSearchHistory.less';

// JS module without types
const useSearchHistory = require('stremio/components/NavBar/HorizontalNavBar/SearchBar/useSearchHistory');

const HISTORY_SIZE = 12;

type ChipProps = {
    className: string,
    href?: string,
    title?: string,
    onClick?: () => void,
    children: React.ReactNode,
};

const Chip = ({ children, ...props }: ChipProps) => {
    const { ref } = useFocusable();
    return <Button ref={ref} {...props}>{children}</Button>;
};

const Chips = ({ children }: { children: React.ReactNode }) => {
    // coming in from the field always lands on the first chip
    const { ref, focusKey } = useFocusable<object, HTMLDivElement>({ saveLastFocusedChild: false });
    return (
        <FocusContext.Provider value={focusKey}>
            <div ref={ref} className={styles['chips']}>{children}</div>
        </FocusContext.Provider>
    );
};

// Search history on the page, in place of the top bar's popup.
const TvSearchHistory = () => {
    const { t } = useTranslation();
    const searchHistory = useSearchHistory();
    const items: { query: string, deepLinks: { search: string } }[] = searchHistory.items ?? [];

    if (items.length === 0) {
        return <div className={styles['hint']}>{t('SEARCH_ANYTHING')}</div>;
    }

    return (
        <div className={styles['tv-search-history']}>
            <div className={styles['title']}>{t('STREMIO_TV_SEARCH_HISTORY_TITLE')}</div>
            <Chips>
                {
                    items.slice(0, HISTORY_SIZE).map(({ query, deepLinks }, index) => (
                        <Chip key={index} className={styles['chip']} href={deepLinks.search} title={query}>
                            <Icon className={styles['chip-icon']} name={'search'} />
                            <span className={styles['chip-label']}>{query}</span>
                        </Chip>
                    ))
                }
                <Chip className={classnames(styles['chip'], styles['clear'])} onClick={searchHistory.clear}>
                    {t('CLEAR_HISTORY')}
                </Chip>
            </Chips>
        </div>
    );
};

export default TvSearchHistory;
