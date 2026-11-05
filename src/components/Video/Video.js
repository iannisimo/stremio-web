// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const { useTranslation } = require('react-i18next');
const { useNavigate } = require('react-router');
const { default: toPath } = require('stremio-router/toPath');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { useFocusable } = require('@noriginmedia/norigin-spatial-navigation');
const { Button, Image } = require('stremio/components');
const useProfile = require('stremio/common/useProfile');
const { usePlatform } = require('stremio/common/Platform');
const { formatEpgTimeRange } = require('stremio/common/EPG');
const { getInterfaceRect } = require('stremio/common/interfaceScale');
const VideoPlaceholder = require('./VideoPlaceholder');
const styles = require('./styles');

const VideoLabel = React.forwardRef(({ shouldScroll, ...props }, ref) => {
    React.useEffect(() => {
        if (shouldScroll && ref.current) {
            // Keep selection scrolling inside the list. scrollIntoView also
            // scrolls outer containers while a drawer is translated offscreen.
            let container = ref.current.parentElement;
            while (container && !['auto', 'scroll', 'overlay'].includes(getComputedStyle(container).overflowY)) {
                container = container.parentElement;
            }
            if (container) {
                const itemBounds = getInterfaceRect(ref.current);
                const listBounds = getInterfaceRect(container);
                const top = itemBounds.top < listBounds.top ? itemBounds.top - listBounds.top
                    : Math.max(0, itemBounds.bottom - listBounds.bottom);
                if (top !== 0) container.scrollBy({ top, behavior: 'smooth' });
            }
        }
    }, [shouldScroll, ref]);

    return <Button {...props} ref={ref} />;
});

VideoLabel.propTypes = {
    shouldScroll: PropTypes.bool,
};

const Video = ({ className, id, title, thumbnail, season, episode, released, upcoming, watched, progress, scheduled, seasonWatched, selected, deepLinks, isEpg, isNow, startTime, endTime, onSelect, onMarkVideoAsWatched, onMarkSeasonAsWatched, focusKey = undefined, ...props }) => {
    const profile = useProfile();
    const navigate = useNavigate();
    const platform = usePlatform();
    const { t } = useTranslation();

    // HTPC fork: the row is a focus stop (upstream: React.useRef(null))
    const { ref: labelRef, focusKey: labelFocusKey } = useFocusable({ focusKey });

    const selectVideo = React.useCallback(() => {
        if (typeof onSelect === 'function') {
            onSelect();
        }
    }, [onSelect]);
    const videoButtonOnClick = React.useCallback(() => {
        selectVideo();

        if (deepLinks && typeof deepLinks.metaDetailsStreams === 'string') {
            navigate(toPath(deepLinks.metaDetailsStreams), { replace: !platform.isMobile });
        }
    }, [deepLinks, navigate, platform.isMobile, selectVideo]);
    const playButtonOnClick = React.useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        selectVideo();
        if (deepLinks && typeof deepLinks.player === 'string') {
            navigate(toPath(deepLinks.player));
        }
    }, [deepLinks, navigate, selectVideo]);
    const playButtonOnKeyDown = React.useCallback((event) => {
        event.stopPropagation();
    }, []);
    const renderLabel = React.useMemo(() => function renderLabel({ className, id, title, thumbnail, episode, released, upcoming, watched, progress, scheduled, children, ref, ...props }) {
        const blurThumbnail = profile.settings.hideSpoilers && season && episode && !watched;
        const epgTimeRange = isEpg ?
            formatEpgTimeRange(startTime, endTime, profile.settings.interfaceLanguage)
            :
            null;

        return (
            <VideoLabel {...props} ref={ref} shouldScroll={selected && (!watched || !!progress)} className={classnames(className, styles['video-container'], { [styles['selected']]: selected })} title={title}>
                {
                    typeof thumbnail === 'string' && thumbnail.length > 0 ?
                        <div className={styles['thumbnail-container']}>
                            <Image
                                className={classnames(styles['thumbnail'], { [styles['blurred']]: blurThumbnail })}
                                src={thumbnail}
                                alt={' '}
                                renderFallback={() => (
                                    <Icon
                                        className={styles['placeholder-icon']}
                                        name={'symbol'}
                                    />
                                )}
                            />
                            {
                                progress !== null && !isNaN(progress) && progress > 0 ?
                                    <div className={styles['progress-bar-container']}>
                                        <div className={styles['progress-bar']} style={{ width: `${progress}%` }} />
                                        <div className={styles['progress-bar-background']} />
                                    </div>
                                    :
                                    null
                            }
                        </div>
                        :
                        null
                }
                <div className={styles['info-container']}>
                    <div className={styles['title-container']}>
                        {episode !== null && !isNaN(episode) ? `${episode}. ` : null}
                        {typeof title === 'string' && title.length > 0 ? title : id}
                    </div>
                    <div className={styles['flex-row-container']}>
                        {
                            epgTimeRange !== null ?
                                <div className={styles['released-container']}>
                                    {epgTimeRange}
                                </div>
                                :
                                released instanceof Date && !isNaN(released.getTime()) ?
                                    <div className={styles['released-container']}>
                                        {released.toLocaleString(profile.settings.interfaceLanguage, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </div>
                                    :
                                    scheduled ?
                                        <div className={styles['released-container']} title={t('TBA')}>
                                            {t('TBA')}
                                        </div>
                                        :
                                        null
                        }
                        <div className={styles['upcoming-watched-container']}>
                            {
                                upcoming && !watched && !isNow ?
                                    <div className={styles['upcoming-container']}>
                                        <div className={styles['flag-label']}>{t('UPCOMING')}</div>
                                    </div>
                                    :
                                    null
                            }
                            {
                                isNow ?
                                    <div className={styles['live-container']}>
                                        <div className={styles['flag-label']}>
                                            {t('PLAYER_LIVE', { defaultValue: 'Live' })}
                                        </div>
                                    </div>
                                    :
                                    null
                            }
                            {
                                watched && !isNow ?
                                    <div className={styles['watched-container']}>
                                        <Icon className={styles['flag-icon']} name={'eye'} />
                                        <div className={styles['flag-label']}>{t('CTX_WATCHED')}</div>
                                    </div>
                                    :
                                    null
                            }
                        </div>
                    </div>
                </div>
                {
                    deepLinks && typeof deepLinks.player === 'string' ?
                        <Button
                            className={styles['play-button-container']}
                            title={t('CTX_WATCH')}
                            onClick={playButtonOnClick}
                            onKeyDown={playButtonOnKeyDown}
                        >
                            <Icon className={styles['play-icon']} name={'play'} />
                        </Button>
                        :
                        null
                }
                {children}
            </VideoLabel>
        );
    }, [deepLinks, playButtonOnClick, playButtonOnKeyDown, selected, endTime, isEpg, isNow, profile.settings.hideSpoilers, profile.settings.interfaceLanguage, season, startTime, t]);
    // HTPC fork: no popup menu; long press / right click opens our row actions
    return renderLabel({
        className,
        id,
        title,
        thumbnail,
        episode,
        released,
        upcoming,
        watched,
        progress,
        scheduled,
        onClick: videoButtonOnClick,
        // HTPC fork: popups open on the selected row
        'data-focus-key': labelFocusKey,
        ...props,
        ref: labelRef,
    });
};

Video.Placeholder = VideoPlaceholder;

Video.propTypes = {
    className: PropTypes.string,
    focusKey: PropTypes.string,
    id: PropTypes.string,
    title: PropTypes.string,
    thumbnail: PropTypes.string,
    season: PropTypes.number,
    episode: PropTypes.number,
    released: PropTypes.instanceOf(Date),
    upcoming: PropTypes.bool,
    watched: PropTypes.bool,
    progress: PropTypes.number,
    scheduled: PropTypes.bool,
    isEpg: PropTypes.bool,
    isNow: PropTypes.bool,
    startTime: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(Date)
    ]),
    endTime: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(Date)
    ]),
    seasonWatched: PropTypes.bool,
    selected: PropTypes.bool,
    deepLinks: PropTypes.shape({
        metaDetailsStreams: PropTypes.string,
        player: PropTypes.string
    }),
    onSelect: PropTypes.func,
    onMarkVideoAsWatched: PropTypes.func,
    onMarkSeasonAsWatched: PropTypes.func,
};

module.exports = Video;
