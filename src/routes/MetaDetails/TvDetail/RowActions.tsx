import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import toPath from 'stremio/router/toPath';
import { useCore } from 'stremio/core';
import useToast from 'stremio/common/Toast/useToast';
import FullscreenDialog from 'stremio/components/FullscreenDialog';

type EpisodeProps = {
    video: any,
    seasonWatched: boolean,
    onClose: () => void,
};

// Long-press menu for an episode row.
export const EpisodeActions = ({ video, seasonWatched, onClose }: EpisodeProps) => {
    const { t } = useTranslation();
    const core = useCore();
    const navigate = useNavigate();

    const actions = useMemo(() => {
        const dispatch = (args: object) => core.transport.dispatch({ action: 'MetaDetails', args });
        const link = video.deepLinks?.metaDetailsStreams;
        return [
            typeof link === 'string' ? {
                label: t('CTX_WATCH'),
                onClick: () => {
                    onClose();
                    navigate(toPath(link), { replace: true });
                },
            } : null,
            {
                label: video.watched ? t('CTX_MARK_NON_WATCHED') : t('CTX_MARK_WATCHED'),
                onClick: () => {
                    onClose();
                    dispatch({ action: 'MarkVideoAsWatched', args: [{ id: video.id, released: video.released }, !video.watched] });
                },
            },
            typeof video.season === 'number' ? {
                label: seasonWatched ? t('CTX_UNMARK_REST') : t('CTX_MARK_REST'),
                onClick: () => {
                    onClose();
                    dispatch({ action: 'MarkSeasonAsWatched', args: [video.season, !seasonWatched] });
                },
            } : null,
            { label: t('BUTTON_CLOSE'), onClick: onClose },
        ].filter((action): action is NonNullable<typeof action> => action !== null);
    }, [video, seasonWatched, onClose, t]);

    const title = typeof video.season === 'number' && typeof video.episode === 'number' ?
        `S${video.season}E${video.episode}${video.title ? ` ${video.title}` : ''}`
        :
        (video.title ?? '');

    return <FullscreenDialog title={title} message={video.overview ?? undefined} actions={actions} onClose={onClose} />;
};

type StreamProps = {
    stream: any,
    onPlay: () => void,
    onClose: () => void,
};

// Long-press menu for a stream row. Play re-clicks the row so Stream keeps
// its own playback logic.
export const StreamActions = ({ stream, onPlay, onClose }: StreamProps) => {
    const { t } = useTranslation();
    const toast = useToast();

    const actions = useMemo(() => {
        const copy = (text: string, success: string, error: string) => () => {
            onClose();
            navigator.clipboard.writeText(text)
                .then(() => toast.show({ type: 'success', title: t(success), timeout: 4000 }))
                .catch(() => toast.show({ type: 'error', title: t(error), timeout: 4000 }));
        };
        const links = stream.deepLinks?.externalPlayer;
        return [
            { label: t('CTX_PLAY'), onClick: onPlay },
            links?.streaming ? {
                label: t('CTX_COPY_STREAM_LINK'),
                onClick: copy(links.streaming, 'PLAYER_COPY_STREAM_SUCCESS', 'PLAYER_COPY_STREAM_ERROR'),
            } : null,
            links?.download ? {
                label: t('CTX_COPY_VIDEO_DOWNLOAD_LINK'),
                onClick: copy(links.download, 'PLAYER_COPY_DOWNLOAD_LINK_SUCCESS', 'PLAYER_COPY_DOWNLOAD_LINK_ERROR'),
            } : null,
            links?.magnet ? {
                label: t('CTX_COPY_MAGNET_LINK'),
                onClick: copy(links.magnet, 'PLAYER_COPY_MAGNET_LINK_SUCCESS', 'PLAYER_COPY_MAGNET_LINK_ERROR'),
            } : null,
            { label: t('BUTTON_CLOSE'), onClick: onClose },
        ].filter((action): action is NonNullable<typeof action> => action !== null);
    }, [stream, onPlay, onClose, t, toast]);

    return (
        <FullscreenDialog
            title={stream.name || stream.addonName || ''}
            message={stream.description ?? undefined}
            actions={actions}
            onClose={onClose}
        />
    );
};
