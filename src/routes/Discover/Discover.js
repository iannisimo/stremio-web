// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const { useTranslation } = require('react-i18next');
const { useParams, useNavigate } = require('react-router');
const { useSearchParams } = require('react-router-dom');
const classnames = require('classnames');
const { useCore } = require('stremio/core');
const { CONSTANTS, useMediaQuery, useOnScrollToBottom, withCoreSuspender } = require('stremio/common');
const { epgDateKey, parseEpgDate } = require('stremio/common/EPG');
const screenSizes = require('stremio/common/screen-sizes.less');
const { default: getMetaDetailsHref } = require('stremio/common/getMetaDetailsHref');
const { default: toPath } = require('stremio-router/toPath');
const { DelayedRenderer, Image, MainNavBars, MetaItem, MetaPreview, MultiselectMenu } = require('stremio/components');
const useDiscover = require('./useDiscover');
const useSelectableInputs = require('./useSelectableInputs');
const { default: Guide } = require('./Guide');
const { default: DaySelector } = require('./Guide/DaySelector');
const { default: useLiveTvGuide } = require('./useLiveTvGuide');
const styles = require('./styles');

const SCROLL_TO_BOTTOM_THRESHOLD = 400;
// HTPC fork: the first card, where the page starts
const GRID_FOCUS_KEY = 'discover:grid';

const Discover = () => {
    const { type, transportUrl, catalogId } = useParams();
    const urlParams = React.useMemo(() => ({
        type,
        transportUrl,
        catalogId
    }), [type, transportUrl, catalogId]);
    const [queryParams, setQueryParams] = useSearchParams();
    // the selected EPG date lives in the `epg_date` query param only -
    // it is stripped from the catalog extra passed to the discover model
    const epgDate = React.useMemo(() => {
        const date = queryParams.get('epg_date');
        return parseEpgDate(date) !== null ? date : null;
    }, [queryParams]);
    const catalogQueryParams = React.useMemo(() => {
        const params = new URLSearchParams(queryParams);
        params.delete('epg_date');
        return params;
    }, [queryParams]);
    const { t } = useTranslation();
    const core = useCore();
    const [discover, loadNextPage] = useDiscover(urlParams, catalogQueryParams);
    const [selectInputs, hasNextPage] = useSelectableInputs(discover);
    const [selectedMetaItemIndex, setSelectedMetaItemIndex] = React.useState(0);
    const compactEpgDate = useMediaQuery(`(max-width: ${screenSizes.xsmall}) and (max-height: ${screenSizes['phone-landscape-size']}) and (orientation: landscape)`);

    const selectedMetaItem = React.useMemo(() => {
        return discover.catalog?.content.type === 'Ready' &&
            discover.catalog.content.content[selectedMetaItemIndex] || null;
    }, [discover.catalog, selectedMetaItemIndex]);

    const metasContainerRef = React.useRef();
    const metaPreviewRef = React.useRef();
    const previousCatalogSizeRef = React.useRef(0);

    const isEpgLayout = discover.selectable.catalogs.find(({ selected }) => selected)?.isEpgGuide === true;
    const guide = useLiveTvGuide(discover, epgDate, isEpgLayout);
    const onEpgDayChange = React.useCallback((day) => {
        const date = epgDateKey(day);
        setQueryParams((params) => {
            const nextParams = new URLSearchParams(params);
            nextParams.set('epg_date', date);
            return nextParams;
        }, { replace: true });
    }, [setQueryParams]);
    // HTPC fork: a program opens its channel on the program list, no preview dialog
    const navigate = useNavigate();
    const onProgramSelect = React.useCallback((_program, channel) => {
        const href = getMetaDetailsHref(channel.deepLinks, true);
        if (href !== null) {
            navigate(toPath(href));
        }
    }, [navigate]);

    React.useEffect(() => {
        if (!isEpgLayout && discover.catalog?.content.type === 'Loading' && metasContainerRef.current) {
            metasContainerRef.current.scrollTop = 0;
            previousCatalogSizeRef.current = 0;
        }
    }, [discover.catalog, isEpgLayout]);
    React.useEffect(() => {
        if (!isEpgLayout && discover.catalog?.content.type === 'Ready') {
            const catalogSize = discover.catalog.content.content.length;
            const hasNewItems = catalogSize > previousCatalogSizeRef.current;
            previousCatalogSizeRef.current = catalogSize;
            if (!hasNextPage || !hasNewItems || !metasContainerRef.current) {
                return;
            }

            const containerHeight = metasContainerRef.current.scrollHeight;
            const viewportHeight = metasContainerRef.current.clientHeight;
            if (containerHeight <= viewportHeight + SCROLL_TO_BOTTOM_THRESHOLD) {
                loadNextPage();
            }
        }
    }, [discover.catalog, isEpgLayout, hasNextPage, loadNextPage]);
    const addToLibrary = React.useCallback(() => {
        if (selectedMetaItem === null) {
            return;
        }

        core.transport.dispatch({
            action: 'Ctx',
            args: {
                action: 'AddToLibrary',
                args: selectedMetaItem
            }
        });
    }, [selectedMetaItem]);
    const removeFromLibrary = React.useCallback(() => {
        if (selectedMetaItem === null) {
            return;
        }

        core.transport.dispatch({
            action: 'Ctx',
            args: {
                action: 'RemoveFromLibrary',
                args: selectedMetaItem.id
            }
        });
    }, [selectedMetaItem]);
    const toggleWatched = React.useCallback(() => {
        if (selectedMetaItem === null) {
            return;
        }

        core.transport.dispatch({
            action: 'Ctx',
            args: {
                action: 'MetaItemMarkAsWatched',
                args: {
                    meta_item: selectedMetaItem,
                    is_watched: !selectedMetaItem.watched,
                }
            }
        });
    }, [selectedMetaItem]);
    const metaItemsOnFocusCapture = React.useCallback((event) => {
        if (event.target.dataset.index !== null && !isNaN(event.target.dataset.index)) {
            setSelectedMetaItemIndex(parseInt(event.target.dataset.index, 10));
        }
    }, []);
    const metaItemOnClick = React.useCallback((event) => {
        const index = Number(event.currentTarget.dataset.index);
        const hasIndex = Number.isInteger(index);

        if (!hasIndex) {
            return;
        }

        const visible = metaPreviewRef.current && window.getComputedStyle(metaPreviewRef.current).display !== 'none';
        if (event.currentTarget.dataset.index !== selectedMetaItemIndex.toString() && visible) {
            event.preventDefault();
            event.currentTarget.focus();
        }
    }, [selectedMetaItemIndex]);
    const onScrollToBottom = React.useCallback(() => {
        if (hasNextPage) {
            loadNextPage();
        }
    }, [hasNextPage, loadNextPage]);
    const onScroll = useOnScrollToBottom(onScrollToBottom, SCROLL_TO_BOTTOM_THRESHOLD);
    React.useEffect(() => {
        setSelectedMetaItemIndex(0);
    }, [discover.selected]);
    const renderEmptyState = () => (
        <DelayedRenderer delay={500}>
            <div className={styles['message-container']}>
                <Image className={styles['image']} src={require('/assets/images/empty.png')} alt={' '} />
                <div className={styles['message-label']}>{t('NO_CATALOG_SELECTED')}</div>
            </div>
        </DelayedRenderer>
    );

    const renderErrorState = (msg) => (
        <div className={styles['message-container']}>
            <Image className={styles['image']} src={require('/assets/images/empty.png')} alt={' '} />
            <div className={styles['message-label']}>{msg}</div>
        </div>
    );

    const renderCatalogContent = () => {
        // in EPG mode the discover catalog is intentionally not loaded -
        // the guide feeds from the LiveTvGuide model instead
        if (isEpgLayout) {
            return (
                <Guide
                    {...guide}
                    onProgramSelect={onProgramSelect}
                />
            );
        }

        if (discover.catalog === null) return renderEmptyState();
        if (discover.catalog.content.type === 'Err') return renderErrorState(discover.catalog.content.content);

        if (discover.catalog.content.type === 'Loading') {
            return (
                <div ref={metasContainerRef} className={classnames(styles['meta-items-container'], 'animation-fade-in')}>
                    {Array(CONSTANTS.CATALOG_PAGE_SIZE).fill(null).map((_, index) => (
                        <div key={index} className={styles['meta-item-placeholder']}>
                            <div className={styles['poster-container']} />
                            <div className={styles['title-bar-container']}>
                                <div className={styles['title-label']} />
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div ref={metasContainerRef} className={classnames(styles['meta-items-container'], 'animation-fade-in')} onScroll={onScroll} onFocusCapture={metaItemsOnFocusCapture}>
                {discover.catalog.content.content.map((metaItem, index) => (
                    <MetaItem
                        key={index}
                        focusKey={index === 0 ? GRID_FOCUS_KEY : undefined}
                        className={classnames({ 'selected': selectedMetaItemIndex === index })}
                        type={metaItem.type}
                        name={metaItem.name}
                        poster={metaItem.poster}
                        posterShape={metaItem.posterShape}
                        playname={selectedMetaItemIndex === index}
                        deepLinks={metaItem.deepLinks}
                        watched={metaItem.watched}
                        metaItem={metaItem}
                        data-index={index}
                        onClick={metaItemOnClick}
                    />
                ))}
            </div>
        );
    };

    const metaPreviewProps = selectedMetaItem && {
        compact: true,
        name: selectedMetaItem.name,
        logo: selectedMetaItem.logo,
        runtime: selectedMetaItem.runtime,
        releaseInfo: selectedMetaItem.releaseInfo,
        released: selectedMetaItem.released,
        description: selectedMetaItem.description,
        deepLinks: selectedMetaItem.deepLinks,
        trailerStreams: selectedMetaItem.trailerStreams,
        inLibrary: selectedMetaItem.inLibrary,
        toggleInLibrary: selectedMetaItem.inLibrary ? removeFromLibrary : addToLibrary,
        watched: selectedMetaItem.watched,
        toggleWatched,
        metaId: selectedMetaItem.id,
        like: selectedMetaItem.like,
        readOnly: true,
    };

    const renderMetaPreview = () => {
        if (isEpgLayout) {
            return null;
        }

        if (selectedMetaItem !== null) {
            return <MetaPreview
                {...metaPreviewProps}
                className={styles['meta-preview-container']}
                ref={metaPreviewRef}
                background={selectedMetaItem.background ?? selectedMetaItem.poster}
                links={selectedMetaItem.links}
            />;
        } else if (discover.catalog !== null && discover.catalog.content.type === 'Loading') {
            return <div className={styles['meta-preview-container']} />;
        }

        return null;
    };
    return (
        <MainNavBars className={styles['discover-container']} route={'discover'} startFocusKey={GRID_FOCUS_KEY}>
            <div className={styles['discover-content']}>
                <div className={styles['catalog-container']}>
                    <div className={classnames(styles['selectable-inputs-container'], { [styles['epg-inputs']]: isEpgLayout })}>
                        <div className={styles['selectable-inputs']}>
                            {selectInputs.map(({ title, options, value, onSelect }, index) => (
                                <MultiselectMenu
                                    key={index}
                                    className={styles['select-input']}
                                    title={title}
                                    options={options}
                                    value={value}
                                    onSelect={onSelect}
                                    portal={isEpgLayout}
                                />
                            ))}
                        </div>
                        {
                            isEpgLayout && compactEpgDate ?
                                <DaySelector
                                    compact={true}
                                    selectedDate={guide.selectedDate}
                                    today={guide.today}
                                    onDayChange={onEpgDayChange}
                                />
                                :
                                null
                        }
                    </div>
                    {
                        discover.catalog !== null && !discover.catalog.installed ?
                            <div className={styles['missing-addon-warning-container']}>
                                <div className={styles['warning-label']}>{t('ERR_ADDON_NOT_INSTALLED')}</div>
                            </div>
                            :
                            null
                    }
                    {
                        isEpgLayout && !compactEpgDate ?
                            <DaySelector
                                selectedDate={guide.selectedDate}
                                today={guide.today}
                                onDayChange={onEpgDayChange}
                            />
                            :
                            null
                    }
                    {renderCatalogContent()}
                </div>
                {renderMetaPreview()}
            </div>
        </MainNavBars>
    );
};

const DiscoverFallback = () => (
    <MainNavBars className={styles['discover-container']} route={'discover'} startFocusKey={GRID_FOCUS_KEY} />
);

module.exports = withCoreSuspender(Discover, DiscoverFallback);
