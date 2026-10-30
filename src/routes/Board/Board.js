// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const classnames = require('classnames');
const useTranslate = require('stremio/common/useTranslate');
const { default: useVisibleCatalogs } = require('stremio/common/useVisibleCatalogs');
const { useStreamingServer, useNotifications, withCoreSuspender, useProfile } = require('stremio/common');
const { ContinueWatchingItem, LiveTvContinueWatchingItem, MainNavBars, MetaItem } = require('stremio/components');
const TvRow = require('stremio/components/TvRow');
const TvEventModal = require('stremio/components/TvEventModal');
const useBoard = require('./useBoard');
const useContinueWatchingPreview = require('./useContinueWatchingPreview');
const { default: useLiveTvContinueWatching } = require('./useLiveTvContinueWatching');
const styles = require('./styles');
const { default: TvServerWarning } = require('./TvServerWarning');
const { default: Hero } = require('./Hero');
const useEvents = require('stremio/components/EventModal/useEvents');

const THRESHOLD = 5;

const hideOnError = (event) => {
    event.currentTarget.style.display = 'none';
};

// Landscape art for Continue Watching, from metahub by IMDb id.
const toLandscape = (item) => {
    const imdb = typeof item._id === 'string' && item._id.startsWith('tt') ? item._id.split(':')[0] : null;
    if (imdb === null) return item;
    return {
        ...item,
        posterShape: 'landscape',
        poster: {
            src: `https://images.metahub.space/background/medium/${imdb}/img`,
            shape: 'landscape',
            changeCursor: true,
            overlay: (
                <img
                    className={styles['continue-watching-logo']}
                    src={`https://images.metahub.space/logo/medium/${imdb}/img`}
                    alt={' '}
                    onError={hideOnError}
                />
            ),
        },
    };
};

const Board = () => {
    const t = useTranslate();
    const streamingServer = useStreamingServer();
    const continueWatchingPreview = useContinueWatchingPreview();
    const liveTvContinueWatching = useLiveTvContinueWatching();
    const [board, loadBoardRows] = useBoard();
    const notifications = useNotifications();
    const profile = useProfile();
    const continueWatchingCatalog = React.useMemo(() => ({
        ...continueWatchingPreview,
        items: continueWatchingPreview.items.map(toLandscape),
    }), [continueWatchingPreview]);
    const liveTvCatalog = React.useMemo(() => ({
        items: (Array.isArray(liveTvContinueWatching.items) ? liveTvContinueWatching.items : [])
            .map((item) => ({ ...item, posterShape: 'landscape' })),
    }), [liveTvContinueWatching.items]);
    const boardCatalogsOffset =
        (continueWatchingPreview.items.length > 0 ? 1 : 0) +
        (liveTvCatalog.items.length > 0 ? 1 : 0);
    const { events } = useEvents();
    const eventModalOpen = events?.modal?.type === 'Ready' && !!events.modal.content;
    const showStreamingServerWarning = React.useMemo(() => {
        return !eventModalOpen && streamingServer.settings !== null && streamingServer.settings.type === 'Err' && (
            isNaN(profile.settings.streamingServerWarningDismissed.getTime()) ||
            profile.settings.streamingServerWarningDismissed.getTime() < Date.now());
    }, [eventModalOpen, profile.settings, streamingServer.settings]);
    const { catalogRows, scrollContainerRef, onScroll } = useVisibleCatalogs({
        catalogs: board.catalogs,
        loadRange: loadBoardRows,
        leadingRows: boardCatalogsOffset,
        preloadRows: THRESHOLD,
    });
    return (
        <div className={styles['board-container']}>
            <TvEventModal />
            <MainNavBars className={styles['board-content-container']} route={'board'}>
                <div ref={scrollContainerRef} className={styles['board-content']} onScroll={onScroll}>
                    <Hero catalogs={board.catalogs} />
                    {
                        continueWatchingPreview.items.length > 0 ?
                            <TvRow
                                className={classnames(styles['board-row'], styles['continue-watching-row'], 'animation-fade-in')}
                                title={t.string('BOARD_CONTINUE_WATCHING')}
                                catalog={continueWatchingCatalog}
                                itemComponent={ContinueWatchingItem}
                                notifications={notifications}
                            />
                            :
                            null
                    }
                    {
                        liveTvCatalog.items.length > 0 ?
                            <TvRow
                                className={classnames(styles['board-row'], styles['board-row-landscape'], 'animation-fade-in')}
                                title={t.string('BOARD_CONTINUE_WATCHING_LIVE')}
                                catalog={liveTvCatalog}
                                itemComponent={LiveTvContinueWatchingItem}
                                notifications={notifications}
                            />
                            :
                            null
                    }
                    {catalogRows.map(({ catalog, index }) => {
                        switch (catalog.content?.type) {
                            case 'Ready': {
                                return (
                                    <TvRow
                                        key={index}
                                        className={classnames(styles['board-row'], styles[`board-row-${catalog.content.content[0].posterShape}`], 'animation-fade-in')}
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
                                            className={classnames(styles['board-row'], 'animation-fade-in')}
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
                                        className={classnames(styles['board-row'], styles['board-row-poster'], 'animation-fade-in')}
                                        catalog={catalog}
                                        title={t.catalogTitle(catalog)}
                                    />
                                );
                            }
                        }
                    })}
                </div>
            </MainNavBars>
            {
                showStreamingServerWarning ?
                    <TvServerWarning />
                    :
                    null
            }
        </div>
    );
};

const BoardFallback = () => (
    <div className={styles['board-container']}>
        <MainNavBars className={styles['board-content-container']} route={'board'} />
    </div>
);

module.exports = withCoreSuspender(Board, BoardFallback);
