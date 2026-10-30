import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import { doesFocusableExist } from '@noriginmedia/norigin-spatial-navigation';
import { useCore } from 'stremio/core';
import useProfile from 'stremio/common/useProfile';
import Button from 'stremio/components/Button';
import Image from 'stremio/components/Image';
import TextInput from 'stremio/components/TextInput';
import VideoRow from 'stremio/components/Video';
import { setFocus, useFocusable, useLongPressEnter } from 'stremio/services/Navigation';
import EpisodePicker from '../EpisodePicker';
import { seasonsOf, pickSeason, videosForSeason, pickInitialVideoId } from './detailLogic';
import { EpisodeActions } from './RowActions';
import TvSeasonSwitcher from './TvSeasonSwitcher';
import styles from './TvEpisodesPanel.less';

// the JS row infers its props too narrowly
const Video = VideoRow as React.ComponentType<any> & { Placeholder: typeof VideoRow.Placeholder };

const SEARCH_KEY = 'detail-episode-search';

type Props = {
    metaItem: any,
    libraryItem: any,
    season: number | null,
    returnVideoId: string | null,
    seasonOnSelect: (event: { type: string, value: number }) => void,
    toggleNotifications: () => void,
};

const TvEpisodesPanel = ({ metaItem, libraryItem, season, returnVideoId, seasonOnSelect, toggleNotifications }: Props) => {
    const { t } = useTranslation();
    const core = useCore();
    const profile = useProfile();
    const [search, setSearch] = useState('');
    const libraryVideoId: string | undefined = libraryItem?.state?.video_id;
    const ready = metaItem?.content?.type === 'Ready';
    const meta = ready ? metaItem.content.content : null;

    const videos: any[] = useMemo(() => meta?.videos ?? [], [meta]);
    const seasons = useMemo(() => seasonsOf(videos), [videos]);
    const selectedSeason = useMemo(() => {
        return pickSeason({ seasons, season, videos, libraryVideoId });
    }, [seasons, season, videos, libraryVideoId]);
    const seasonVideos: any[] = useMemo(() => videosForSeason(videos, selectedSeason), [videos, selectedSeason]);
    const seasonWatched = useMemo(() => seasonVideos.every((video) => video.watched), [seasonVideos]);
    const visibleVideos = useMemo(() => {
        const query = search.toLowerCase();
        return seasonVideos.filter((video) => {
            return query.length === 0 ||
                (typeof video.title === 'string' && video.title.toLowerCase().includes(query)) ||
                (video.released instanceof Date && !isNaN(video.released.getTime()) &&
                    video.released.toLocaleString(profile.settings.interfaceLanguage, { year: '2-digit', month: 'short', day: 'numeric' }).toLowerCase().includes(query));
        });
    }, [seasonVideos, search, profile.settings.interfaceLanguage]);
    const showNotifications = !!meta?.inLibrary && videos.length > 0 && !!libraryItem;

    const onSeasonSelect = useCallback((value: number) => seasonOnSelect({ type: 'select', value }), [seasonOnSelect]);
    const onSeasonSearch = useCallback((value: number) => {
        if (value) onSeasonSelect(value);
    }, [onSeasonSelect]);

    const onMarkVideoAsWatched = useCallback((video: object, watched: boolean) => {
        core.transport.dispatch({
            action: 'MetaDetails',
            args: { action: 'MarkVideoAsWatched', args: [video, !watched] }
        });
    }, []);
    const onMarkSeasonAsWatched = useCallback((value: number, watched: boolean) => {
        core.transport.dispatch({
            action: 'MetaDetails',
            args: { action: 'MarkSeasonAsWatched', args: [value, !watched] }
        });
    }, []);

    const [menuVideoId, setMenuVideoId] = useState<string | null>(null);
    const longPress = useLongPressEnter(useCallback((target: HTMLElement) => {
        const id = target.closest<HTMLElement>('[data-row-id]')?.dataset.rowId;
        if (id) setMenuVideoId(id);
    }, []));
    const closeMenu = useCallback(() => {
        setMenuVideoId((id) => {
            if (id) window.setTimeout(() => setFocus(`detail-episode-${id}`), 0);
            return null;
        });
    }, []);
    const menuVideo = menuVideoId === null ? null : seasonVideos.find((video) => video.id === menuVideoId);

    // Left/right move the caret; up/down leave the field.
    const { ref: searchRef } = useFocusable<object, HTMLInputElement>({
        focusKey: SEARCH_KEY,
        onArrowPress: (direction) => direction === 'up' || direction === 'down',
    });
    const onSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => setSearch(event.target.value), []);

    // First focus once per title: the episode being watched, else the first.
    // Not when the user already moved, or a dialog is open.
    const titleKey: string | undefined = meta?.id;
    const userMoved = useRef(false);
    const focusedFor = useRef<string | null>(null);
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key.startsWith('Arrow')) userMoved.current = true;
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, []);
    useEffect(() => {
        if (!ready || titleKey === undefined || focusedFor.current === titleKey) return;
        const timer = window.setTimeout(() => {
            if (focusedFor.current === titleKey) return;
            focusedFor.current = titleKey;
            if (userMoved.current || document.querySelector('.modals-container > .modal-container')) return;
            const id = returnVideoId !== null && seasonVideos.some((video) => video.id === returnVideoId) ?
                returnVideoId
                :
                pickInitialVideoId({ videosForSeason: seasonVideos, libraryVideoId });
            if (id !== null) {
                setFocus(`detail-episode-${id}`);
            } else {
                setFocus(doesFocusableExist('detail-action-trailer') ? 'detail-action-trailer' : 'detail-action-library');
            }
        }, 0);
        return () => window.clearTimeout(timer);
    }, [ready, titleKey, seasonVideos, returnVideoId, libraryVideoId]);

    if (!metaItem || metaItem.content.type === 'Loading') {
        return (
            <div className={styles['tv-episodes-panel']}>
                <div className={styles['list']}>
                    <Video.Placeholder />
                    <Video.Placeholder />
                    <Video.Placeholder />
                    <Video.Placeholder />
                </div>
            </div>
        );
    }

    if (metaItem.content.type === 'Err' || seasonVideos.length === 0) {
        return (
            <div className={styles['tv-episodes-panel']}>
                <div className={styles['message']}>
                    <EpisodePicker className={styles['picker']} seriesId={''} onSubmit={onSeasonSearch} />
                    <Image className={styles['message-image']} src={require('/assets/images/empty.png')} alt={' '} />
                    <div className={styles['message-label']}>{t('ERR_NO_VIDEOS_FOR_META')}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles['tv-episodes-panel']}>
            <div className={styles['header']}>
                {
                    seasons.length > 0 && selectedSeason !== null ?
                        <TvSeasonSwitcher seasons={seasons} season={selectedSeason} onSelect={onSeasonSelect} />
                        :
                        null
                }
                <TextInput
                    ref={searchRef}
                    className={styles['search']}
                    value={search}
                    placeholder={t('SEARCH_VIDEOS')}
                    onChange={onSearchChange}
                />
            </div>
            {
                showNotifications || selectedSeason !== null ?
                    <div className={styles['toggles']}>
                        {
                            selectedSeason !== null ?
                                <Button
                                    focusKey={'detail-season-watched'}
                                    className={styles['chip']}
                                    onClick={() => onMarkSeasonAsWatched(selectedSeason, seasonWatched)}
                                >
                                    {seasonWatched ? t('CTX_UNMARK_REST') : t('CTX_MARK_REST')}
                                </Button>
                                :
                                null
                        }
                        {
                            showNotifications ?
                                <Button
                                    focusKey={'detail-notifications'}
                                    className={classnames(styles['chip'], { [styles['selected']]: !libraryItem.state.noNotif })}
                                    onClick={toggleNotifications}
                                >
                                    {t('DETAIL_RECEIVE_NOTIF_SERIES')}
                                </Button>
                                :
                                null
                        }
                    </div>
                    :
                    null
            }
            <div className={styles['list']} {...longPress}>
                {
                    visibleVideos.map((video) => (
                        <div key={video.id} data-row-id={video.id}>
                            <Video
                                focusKey={`detail-episode-${video.id}`}
                                id={video.id}
                                title={video.title}
                                thumbnail={video.thumbnail}
                                season={video.season}
                                episode={video.episode}
                                released={video.released}
                                upcoming={video.upcoming}
                                watched={video.watched}
                                progress={video.progress}
                                deepLinks={video.deepLinks}
                                scheduled={video.scheduled}
                                seasonWatched={seasonWatched}
                                selected={video.id === libraryVideoId}
                                onMarkVideoAsWatched={onMarkVideoAsWatched}
                                onMarkSeasonAsWatched={onMarkSeasonAsWatched}
                            />
                        </div>
                    ))
                }
            </div>
            {menuVideo ? <EpisodeActions video={menuVideo} seasonWatched={seasonWatched} onClose={closeMenu} /> : null}
        </div>
    );
};

export default TvEpisodesPanel;
