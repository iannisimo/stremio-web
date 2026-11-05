import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import Icon from '@stremio/stremio-icons/react';
import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import Image from 'stremio/components/Image';
import useProfile from 'stremio/common/useProfile';
import { useLongPressEnter } from 'stremio/services/Input';
import { FocusButton as Button } from 'stremio/services/Navigation';
import { FIRST_ROW_FOCUS_KEY } from './TvDetail';
import { setOpenedEpisode } from './openedEpisode';
import TvChipRow from './TvChipRow';
import StreamRow from '../StreamsList/Stream';
import EpisodePicker from '../EpisodePicker';
import { StreamActions } from './TvRowActions';
import useStreamsByAddon from './useStreamsByAddon';
import styles from './TvStreamsPanel.less';

// JS component without types
const Stream = StreamRow as React.ComponentType<any> & { Placeholder: typeof StreamRow.Placeholder };

const ALL_ADDONS_KEY = 'ALL';

type Props = {
    streams: any[],
    video: any | null,
    type: string,
    externalPlayerCallbackCanMarkWatched: boolean,
    onEpisodeSearch: (season: number, episode: number) => void,
    onBack: () => void,
};

const TvStreamsPanel = ({ streams, video, type, externalPlayerCallbackCanMarkWatched, onEpisodeSearch, onBack }: Props) => {
    const { t } = useTranslation();
    const profile = useProfile();
    const listRef = useRef<HTMLDivElement>(null);
    const [selectedAddon, setSelectedAddon] = useState(ALL_ADDONS_KEY);
    const streamsByAddon = useStreamsByAddon(streams);
    const effectiveAddon = Object.prototype.hasOwnProperty.call(streamsByAddon, selectedAddon) ? selectedAddon : ALL_ADDONS_KEY;
    const filteredStreams = useMemo(() => {
        return effectiveAddon === ALL_ADDONS_KEY ?
            Object.values(streamsByAddon).map(({ streams }) => streams).flat(1)
            :
            streamsByAddon[effectiveAddon].streams;
    }, [streamsByAddon, effectiveAddon]);
    const countLoadingAddons = useMemo(() => {
        return streams.filter((stream) => stream.content.type === 'Loading').length;
    }, [streams]);
    const showInstallAddonsButton = !profile || profile.auth === null || (profile.auth?.user?.isNewUser === true && !video?.upcoming);
    const addons = Object.keys(streamsByAddon);
    const hasStreams = filteredStreams.length > 0;

    // Opening the panel goes to the first stream, also when it replaces the
    // episode list; the list then goes back to this episode.
    useEffect(() => {
        setFocus(FIRST_ROW_FOCUS_KEY);
    }, []);
    useEffect(() => {
        if (typeof video?.id === 'string') setOpenedEpisode(video.id);
    }, [video?.id]);

    const [menu, setMenu] = useState<{ index: number, element: HTMLElement } | null>(null);
    const longPress = useLongPressEnter(useCallback((target: HTMLElement) => {
        const row = target.closest<HTMLElement>('[data-row-index]');
        if (row) setMenu({ index: Number(row.dataset.rowIndex), element: target });
    }, []));
    const closeMenu = useCallback(() => setMenu(null), []);
    const playFromMenu = useCallback(() => {
        const element = menu?.element;
        closeMenu();
        // after the dialog is gone
        setTimeout(() => element?.click(), 0);
    }, [menu, closeMenu]);

    const selectAddon = useCallback((value: string) => {
        listRef.current?.scrollTo({ top: 0 });
        setSelectedAddon(value);
    }, []);

    const renderEpisodePicker = type === 'series' ?
        <EpisodePicker className={styles['picker']} seriesId={''} onSubmit={onEpisodeSearch} />
        :
        null;
    const installButton = showInstallAddonsButton ?
        <Button className={styles['install-button']} title={t('ADDON_CATALOGUE_MORE')} href={'#/addons'}>
            <Icon className={styles['icon']} name={'addons'} />
            <div className={styles['label']}>{t('ADDON_CATALOGUE_MORE')}</div>
        </Button>
        :
        null;

    return (
        <div className={styles['tv-streams-panel']}>
            {
                video ?
                    <div className={styles['episode-header']}>
                        <Button className={styles['chip']} title={t('BUTTON_BACK', { defaultValue: 'Back' })} onClick={onBack}>
                            <Icon className={styles['icon']} name={'chevron-back'} />
                        </Button>
                        <div className={styles['episode-title']}>
                            {
                                typeof video.season === 'number' && typeof video.episode === 'number' ?
                                    `S${video.season}E${video.episode}${video.title ? ` ${video.title}` : ''}`
                                    :
                                    (video.title ?? '')
                            }
                        </div>
                    </div>
                    :
                    null
            }
            {
                addons.length > 1 ?
                    <TvChipRow className={styles['addon-chips']}>
                        {
                            [ALL_ADDONS_KEY, ...addons].map((value) => (
                                <Button
                                    key={value}
                                    className={classnames(styles['chip'], { [styles['selected']]: value === effectiveAddon })}
                                    onClick={() => selectAddon(value)}
                                >
                                    {value === ALL_ADDONS_KEY ? t('ALL_ADDONS') : streamsByAddon[value].addon.manifest.name}
                                </Button>
                            ))
                        }
                    </TvChipRow>
                    :
                    null
            }
            {
                streams.length === 0 ?
                    <div className={styles['message']}>
                        {renderEpisodePicker}
                        <Image className={styles['message-image']} src={require('/assets/images/empty.png')} alt={' '} />
                        <div className={styles['message-label']}>{t('ERR_NO_ADDONS_FOR_STREAMS')}</div>
                        {installButton}
                    </div>
                    :
                    streams.every((stream) => stream.content.type === 'Err') ?
                        <div className={styles['message']}>
                            {renderEpisodePicker}
                            {video?.upcoming ? <div className={styles['message-label']}>{t('UPCOMING')}...</div> : null}
                            <Image className={styles['message-image']} src={require('/assets/images/empty.png')} alt={' '} />
                            <div className={styles['message-label']}>{t('NO_STREAM')}</div>
                            {installButton}
                        </div>
                        :
                        !hasStreams ?
                            <div className={styles['list']}>
                                <Stream.Placeholder />
                                <Stream.Placeholder />
                            </div>
                            :
                            <>
                                <div ref={listRef} className={styles['list']} {...longPress}>
                                    {filteredStreams.map((stream: any, index: number) => (
                                        <div key={index} data-row-index={index}>
                                            <Stream
                                                focusKey={index === 0 ? FIRST_ROW_FOCUS_KEY : undefined}
                                                videoId={video?.id}
                                                videoReleased={video?.released}
                                                addonName={stream.addonName}
                                                name={stream.name}
                                                description={stream.description}
                                                thumbnail={stream.thumbnail}
                                                progress={stream.progress}
                                                deepLinks={stream.deepLinks}
                                                externalPlayerCallbackCanMarkWatched={externalPlayerCallbackCanMarkWatched}
                                                onClick={stream.onClick}
                                            />
                                        </div>
                                    ))}
                                    {installButton}
                                </div>
                                {
                                    menu && filteredStreams[menu.index] ?
                                        <StreamActions stream={filteredStreams[menu.index]} onPlay={playFromMenu} onClose={closeMenu} />
                                        :
                                        null
                                }
                                {
                                    countLoadingAddons > 0 ?
                                        <div className={styles['loading']}>
                                            <div className={styles['loading-label']}>{countLoadingAddons} {t('MOBILE_ADDONS_LOADING')}</div>
                                            <span className={styles['loading-bar']} />
                                        </div>
                                        :
                                        null
                                }
                            </>
            }
        </div>
    );
};

export default TvStreamsPanel;
