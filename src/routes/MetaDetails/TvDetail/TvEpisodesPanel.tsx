import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useCore } from 'stremio/core';
import useProfile from 'stremio/common/useProfile';
import Image from 'stremio/components/Image';
import { FocusButton as Button } from 'stremio/services/Navigation';
import { takeOpenedEpisode } from './openedEpisode';
import TextInput from 'stremio/components/TextInput';
import VideoRow from 'stremio/components/Video';
import { useLongPressEnter } from 'stremio/services/Input';
import EpisodePicker from '../EpisodePicker';
import { seasonsOf, pickSeason, videosForSeason } from './detailLogic';
import { EpisodeActions } from './TvRowActions';
import TvSeasonSwitcher from './TvSeasonSwitcher';
import styles from './TvEpisodesPanel.less';

// the JS row infers its props too narrowly
const Video = VideoRow as React.ComponentType<any> & { Placeholder: typeof VideoRow.Placeholder };

const episodeFocusKey = (id: string) => `detail:episode:${id}`;

type Props = {
    metaItem: any,
    libraryItem: any,
    season: number | null,
    seasonOnSelect: (event: { type: string, value: number }) => void,
    toggleNotifications: () => void,
};

const TvEpisodesPanel = ({ metaItem, libraryItem, season, seasonOnSelect, toggleNotifications }: Props) => {
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

    // Once the episodes are there: the one whose streams were just open, else
    // the one being watched, else the first.
    const placedFocus = useRef(false);
    useEffect(() => {
        if (placedFocus.current || visibleVideos.length === 0) return;
        placedFocus.current = true;
        const ids = visibleVideos.map((video) => video.id);
        const opened = takeOpenedEpisode();
        const target = [opened, libraryVideoId].find((id) => typeof id === 'string' && ids.includes(id)) ?? ids[0];
        setFocus(episodeFocusKey(target));
    }, [visibleVideos, libraryVideoId]);

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
    const closeMenu = useCallback(() => setMenuVideoId(null), []);
    const menuVideo = menuVideoId === null ? null : seasonVideos.find((video) => video.id === menuVideoId);

    const onSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => setSearch(event.target.value), []);

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
                                focusKey={episodeFocusKey(video.id)}
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
