// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const { useParams, useLocation, useNavigate } = require('react-router');
const { useCore } = require('stremio/core');
const { withCoreSuspender, useProfile } = require('stremio/common');
const { useNavigateWithOrigin, useGoBack } = require('stremio-router');
const { default: toPath } = require('stremio-router/toPath');
const { HorizontalNavBar } = require('stremio/components');
const { default: TvDetail } = require('./TvDetail');
const { default: TvDetailInfo, TvDetailInfoPlaceholder } = require('./TvDetail/TvDetailInfo');
const { default: TvStreamsPanel } = require('./TvDetail/TvStreamsPanel');
const { default: TvEpisodesPanel } = require('./TvDetail/TvEpisodesPanel');
const { default: LiveTvDetails } = require('./LiveTvDetails');
const { default: LiveTvPlaceholder } = require('./LiveTvDetails/Placeholder');
const useMetaDetails = require('./useMetaDetails');
const useSeason = require('./useSeason');
const { default: useExternalPlayerCallback } = require('./useExternalPlayerCallback');
const styles = require('./styles');

const MetaDetails = () => {
    const { type, id, videoId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { getStoredOrigin } = useNavigateWithOrigin();
    const contentRef = React.useRef(null);
    const returnVideoIdRef = React.useRef(null);
    const core = useCore();
    const profile = useProfile();
    const urlParams = React.useMemo(() => ({
        type,
        id,
        videoId
    }), [type, id, videoId]);
    const metaDetails = useMetaDetails(urlParams);
    const readyMeta = metaDetails.metaItem?.content.type === 'Ready' ? metaDetails.metaItem.content.content : null;
    const metaAddonUrl = metaDetails.metaItem?.addon.transportUrl;
    const isEpgProvider = React.useMemo(() => {
        return profile.addons.some((addon) => addon.transportUrl === metaAddonUrl && addon.manifest.behaviorHints?.epgProvider === true);
    }, [profile.addons, metaAddonUrl]);
    const isLiveMeta = isEpgProvider && readyMeta !== null && (readyMeta.behaviorHints?.isLive === true || readyMeta.type === 'tv');
    useExternalPlayerCallback(urlParams, metaDetails);
    const [season, setSeason] = useSeason(urlParams);
    const [metaPath, streamPath] = React.useMemo(() => {
        return metaDetails.selected !== null ?
            [metaDetails.selected.metaPath, metaDetails.selected.streamPath]
            :
            [null, null];
    }, [metaDetails.selected]);
    const video = React.useMemo(() => {
        return streamPath !== null && metaDetails.metaItem !== null && metaDetails.metaItem.content.type === 'Ready' ?
            metaDetails.metaItem.content.content.videos.reduce((result, video) => {
                if (video.id === streamPath.id) {
                    return video;
                }

                return result;
            }, null)
            :
            null;
    }, [metaDetails.metaItem, streamPath]);
    // so the episode list can refocus the episode we came back from
    if (streamPath !== null) {
        returnVideoIdRef.current = streamPath.id;
    }
    const externalPlayerCallbackCanMarkWatched = React.useMemo(() => {
        return typeof video?.id === 'string' &&
            metaDetails.libraryItem?.state?.video_id === video.id &&
            metaDetails.libraryItem?.state?.duration > 0;
    }, [metaDetails.libraryItem, video]);
    const addToLibrary = React.useCallback(() => {
        if (metaDetails.metaItem === null || metaDetails.metaItem.content.type !== 'Ready') {
            return;
        }

        core.transport.dispatch({
            action: 'Ctx',
            args: {
                action: 'AddToLibrary',
                args: metaDetails.metaItem.content.content
            }
        });
    }, [metaDetails]);
    const removeFromLibrary = React.useCallback(() => {
        if (metaDetails.metaItem === null || metaDetails.metaItem.content.type !== 'Ready') {
            return;
        }

        core.transport.dispatch({
            action: 'Ctx',
            args: {
                action: 'RemoveFromLibrary',
                args: metaDetails.metaItem.content.content.id
            }
        });
    }, [metaDetails]);
    const toggleWatched = React.useCallback(() => {
        if (metaDetails.metaItem === null || metaDetails.metaItem.content.type !== 'Ready') {
            return;
        }

        core.transport.dispatch({
            action: 'MetaDetails',
            args: {
                action: 'MarkAsWatched',
                args: !metaDetails.metaItem.content.content.watched
            }
        });
    }, [metaDetails]);
    const toggleNotifications = React.useCallback(() => {
        if (metaDetails.libraryItem) {
            core.transport.dispatch({
                action: 'Ctx',
                args: {
                    action: 'ToggleLibraryItemNotifications',
                    args: [metaDetails.libraryItem._id, !metaDetails.libraryItem.state.noNotif],
                }
            });
        }
    }, [metaDetails.libraryItem]);
    const seasonOnSelect = React.useCallback((event) => {
        setSeason(event.value);
    }, [setSeason]);
    const handleEpisodeSearch = React.useCallback((season, episode) => {
        const searchVideoHash = encodeURIComponent(`${urlParams.id}:${season}:${episode}`);
        const url = location.pathname;
        const searchVideoPath = (urlParams.videoId === undefined || urlParams.videoId === null || urlParams.videoId === '') ?
            url + (!url.endsWith('/') ? '/' : '') + searchVideoHash
            : url.replace(encodeURIComponent(urlParams.videoId), searchVideoHash);
        navigate(searchVideoPath, { replace: true });
    }, [urlParams, location]);
    const originPath = React.useMemo(() => getStoredOrigin(), [getStoredOrigin]);
    const goBack = useGoBack(originPath);
    const onBack = React.useCallback(() => {
        if (streamPath !== null && readyMeta?.type === 'series' && typeof video?.deepLinks?.metaDetailsVideos === 'string') {
            const navigateTo = `${video.deepLinks.metaDetailsVideos}${
                typeof video.season === 'number'
                    ? `?${new URLSearchParams({ 'season': video.season })}`
                    : ''}`;
            navigate(toPath(navigateTo), { replace: true });
        } else {
            goBack();
        }
    }, [streamPath, readyMeta, video, navigate, goBack]);
    if (type === 'tv' && (metaDetails.selected === null || (isEpgProvider && metaDetails.metaItem?.content.type === 'Loading'))) {
        return (
            <div className={styles['metadetails-container']}>
                <HorizontalNavBar
                    className={styles['nav-bar']}
                    backButton={true}
                    fullscreenButton={true}
                    navMenu={true}
                    originPath={originPath}
                />
                <LiveTvPlaceholder />
            </div>
        );
    }
    if (isLiveMeta) {
        return (
            <LiveTvDetails
                key={readyMeta.id}
                className={styles['metadetails-container']}
                contentRef={contentRef}
                meta={readyMeta}
                addonName={metaDetails.metaItem.addon.manifest.name}
                streams={metaDetails.streams}
                onToggleLibrary={readyMeta.inLibrary ? removeFromLibrary : addToLibrary}
            >
                <HorizontalNavBar
                    className={styles['nav-bar']}
                    backButton={true}
                    fullscreenButton={true}
                    navMenu={true}
                    originPath={originPath}
                />
            </LiveTvDetails>
        );
    }
    const metaState = metaPath === null ?
        'none'
        :
        metaDetails.metaItem === null ?
            'noAddons'
            :
            metaDetails.metaItem.content.type === 'Err' ?
                'error'
                :
                metaDetails.metaItem.content.type === 'Loading' ?
                    'loading'
                    :
                    'ready';
    const info = metaState === 'loading' ?
        <TvDetailInfoPlaceholder />
        :
        metaState === 'ready' ?
            <TvDetailInfo
                key={readyMeta.id}
                meta={readyMeta}
                video={video}
                ratingInfo={metaDetails.ratingInfo}
                onToggleLibrary={readyMeta.inLibrary ? removeFromLibrary : addToLibrary}
                onToggleWatched={toggleWatched}
            />
            :
            null;
    // temporary: old components until the TV ones replace them
    const panel = streamPath !== null ?
        <TvStreamsPanel
            streams={metaDetails.streams}
            video={video}
            type={streamPath.type}
            externalPlayerCallbackCanMarkWatched={externalPlayerCallbackCanMarkWatched}
            onEpisodeSearch={handleEpisodeSearch}
            onBack={onBack}
        />
        :
        metaPath !== null ?
            <TvEpisodesPanel
                metaItem={metaDetails.metaItem}
                libraryItem={metaDetails.libraryItem}
                season={season}
                returnVideoId={returnVideoIdRef.current}
                seasonOnSelect={seasonOnSelect}
                toggleNotifications={toggleNotifications}
            />
            :
            null;
    return (
        <TvDetail
            meta={readyMeta}
            metaState={metaState}
            info={info}
            panel={panel}
            onBack={onBack}
        />
    );
};

const MetaDetailsFallback = () => {
    const { type } = useParams();
    const goBack = useGoBack();
    if (type === 'tv') {
        return (
            <div className={styles['metadetails-container']}>
                <HorizontalNavBar
                    className={styles['nav-bar']}
                    backButton={true}
                    fullscreenButton={true}
                    navMenu={true}
                />
                <LiveTvPlaceholder />
            </div>
        );
    }
    return <TvDetail meta={null} metaState={'loading'} info={null} panel={null} onBack={goBack} />;
};

module.exports = withCoreSuspender(MetaDetails, MetaDetailsFallback);
