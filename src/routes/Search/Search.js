// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const classnames = require('classnames');
const useTranslate = require('stremio/common/useTranslate');
const { default: useVisibleCatalogs } = require('stremio/common/useVisibleCatalogs');
const { withCoreSuspender } = require('stremio/common');
const { Image, MainNavBars, MetaItem } = require('stremio/components');
const TvRow = require('stremio/components/TvRow');
const { default: TvSearchField } = require('./TvSearchField');
const { default: TvSearchHistory } = require('./TvSearchHistory');
const useSearch = require('./useSearch');
const styles = require('./styles');
const { useSearchParams } = require('react-router-dom');

// HTPC fork: the search field, where the page starts
const FIELD_FOCUS_KEY = 'search:field';

const Search = () => {
    const [queryParams] = useSearchParams();
    const t = useTranslate();
    const [search, loadSearchRows] = useSearch(queryParams);
    const query = React.useMemo(() => {
        return search.selected !== null ?
            search.selected.extra.reduceRight((query, [name, value]) => {
                if (name === 'search') {
                    return value;
                }

                return query;
            }, null)
            :
            null;
    }, [search.selected]);
    const { catalogRows, scrollContainerRef, onScroll } = useVisibleCatalogs({
        catalogs: search.catalogs,
        loadRange: loadSearchRows,
    });
    return (
        <MainNavBars className={styles['search-container']} route={'search'} query={query} startFocusKey={FIELD_FOCUS_KEY}>
            <div ref={scrollContainerRef} className={styles['search-content']} onScroll={onScroll}>
                <TvSearchField query={query} focusKey={FIELD_FOCUS_KEY} />
                {
                    query === null ?
                        <TvSearchHistory />
                        :
                        search.catalogs.length === 0 ?
                            <div className={styles['message-container']}>
                                <Image
                                    className={styles['image']}
                                    src={require('/assets/images/empty.png')}
                                    alt={' '}
                                />
                                <div className={styles['message-label']}>{ t.string('STREMIO_TV_SEARCH_NO_ADDONS') }</div>
                            </div>
                            :
                            catalogRows.map(({ catalog, index }) => {
                                switch (catalog.content?.type) {
                                    case 'Ready': {
                                        return (
                                            <TvRow
                                                key={index}
                                                className={classnames(styles['search-row'], styles[`search-row-${catalog.content.content[0].posterShape}`], 'animation-fade-in')}
                                                catalog={catalog}
                                                itemComponent={MetaItem}
                                            />
                                        );
                                    }
                                    case 'Err': {
                                        if (catalog.content.content !== 'EmptyContent') {
                                            return (
                                                <TvRow
                                                    key={index}
                                                    className={classnames(styles['search-row'], 'animation-fade-in')}
                                                    catalog={catalog}
                                                    message={catalog.content.content}
                                                />
                                            );
                                        }
                                        return null;
                                    }
                                    default: {
                                        return (
                                            <TvRow.Placeholder
                                                key={index}
                                                className={classnames(styles['search-row'], styles['search-row-poster'], 'animation-fade-in')}
                                                catalog={catalog}
                                                title={t.catalogTitle(catalog)}
                                            />
                                        );
                                    }
                                }
                            })
                }
            </div>
        </MainNavBars>
    );
};

const SearchFallback = () => {
    const [queryParams] = useSearchParams();
    return <MainNavBars className={styles['search-container']} route={'search'} query={queryParams.get('search') ?? queryParams.get('query')} startFocusKey={FIELD_FOCUS_KEY} />;
};

module.exports = withCoreSuspender(Search, SearchFallback);
