import React, { useCallback, useMemo, useState } from 'react';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import Icon from '@stremio/stremio-icons/react';
import Button from 'stremio/components/Button';
import Image from 'stremio/components/Image';
import FullscreenDialog from 'stremio/components/FullscreenDialog';
import SharePrompt from 'stremio/components/SharePrompt';
import useRating from 'stremio/components/MetaPreview/Ratings/useRating';
import useTranslate from 'stremio/common/useTranslate';
import { setFocus } from 'stremio/services/Navigation';
import { groupLinks } from './detailLogic';
import styles from './TvDetailInfo.less';

type Link = { category: string, name: string, url: string };

type Meta = {
    type: string,
    name: string,
    logo?: string | null,
    description?: string | null,
    releaseInfo?: string | null,
    released?: Date | null,
    runtime?: string | null,
    links?: Link[],
    trailerStreams?: { deepLinks?: { player?: string } }[],
    inLibrary: boolean,
    watched: boolean,
};

type Props = {
    meta: Meta,
    video: { overview?: string | null } | null,
    ratingInfo: Loadable<RatingInfo> | null,
    onToggleLibrary: () => void,
    onToggleWatched: () => void,
};

const GENRES = 'Genres';

const TvDetailInfo = ({ meta, video, ratingInfo, onToggleLibrary, onToggleWatched }: Props) => {
    const { t } = useTranslation();
    const { string, stringWithPrefix } = useTranslate();
    const { onLiked, onLoved, liked, loved } = useRating(ratingInfo ?? undefined);
    const [shareOpen, setShareOpen] = useState(false);
    const { imdb, share, groups } = useMemo(() => groupLinks(meta.links), [meta.links]);

    const trailerHref = meta.trailerStreams?.[0]?.deepLinks?.player;
    const ratingReady = ratingInfo?.type === 'Ready';

    const description = typeof video?.overview === 'string' && video.overview.length > 0 ?
        video.overview
        :
        meta.description;

    const infoLine = useMemo(() => {
        const genres = (meta.links ?? [])
            .filter(({ category }) => category === GENRES)
            .slice(0, 2)
            .map(({ name }) => string(name));
        const year = meta.released instanceof Date && !isNaN(meta.released.getTime()) ? String(meta.released.getFullYear()) : null;
        return [
            t(`TYPE_${meta.type}`, { defaultValue: meta.type }),
            genres.join(', '),
            meta.releaseInfo || year,
            meta.runtime,
            imdb ? `IMDb ${imdb.label}` : null,
        ].filter((part) => typeof part === 'string' && part.length > 0);
    }, [meta, imdb, t, string]);

    const actions = useMemo(() => [
        trailerHref ? 'trailer' : null,
        'library',
        'watched',
        'like',
        'love',
        share ? 'share' : null,
    ].filter((key): key is string => key !== null), [trailerHref, share]);
    const lastAction = actions[actions.length - 1];

    const onArrowPress = useCallback((key: string) => (direction: string) => {
        if (direction === 'down') return false;
        if (direction === 'right' && key === lastAction) {
            setFocus('detail-panel');
            return false;
        }
        return true;
    }, [lastAction]);

    const openShare = useCallback(() => setShareOpen(true), []);
    const closeShare = useCallback(() => setShareOpen(false), []);
    const shareActions = useMemo(() => [
        { label: t('BUTTON_CLOSE'), onClick: closeShare },
    ], [t, closeShare]);

    const renderNameFallback = useCallback(() => <h1 className={styles['title']}>{meta.name}</h1>, [meta.name]);

    return (
        <div className={styles['tv-detail-info']}>
            {
                typeof meta.logo === 'string' && meta.logo.length > 0 ?
                    <Image
                        className={styles['logo']}
                        src={meta.logo}
                        alt={meta.name}
                        renderFallback={renderNameFallback}
                    />
                    :
                    renderNameFallback()
            }
            <div className={styles['meta-line']}>
                {infoLine.map((part, index) => <span key={index}>{part}</span>)}
            </div>
            {
                typeof description === 'string' && description.length > 0 ?
                    <p className={styles['description']}>{description}</p>
                    :
                    null
            }
            {
                groups.map(({ category, items }) => (
                    <div key={category} className={styles['chips-row']}>
                        <div className={styles['chips-label']}>{stringWithPrefix(category.toUpperCase(), 'LINKS_')}</div>
                        <div className={styles['chips']}>
                            {
                                items.map(({ label, href }, index) => (
                                    <Button key={index} className={styles['chip']} title={label} href={href}>
                                        {string(label)}
                                    </Button>
                                ))
                            }
                        </div>
                    </div>
                ))
            }
            <div className={styles['actions']}>
                {
                    trailerHref ?
                        <Button focusKey={'detail-action-trailer'} className={styles['button']} href={trailerHref} onArrowPress={onArrowPress('trailer')}>
                            <Icon className={styles['icon']} name={'trailer'} />
                            <span>{t('TRAILER')}</span>
                        </Button>
                        :
                        null
                }
                <Button focusKey={'detail-action-library'} className={styles['button']} onClick={onToggleLibrary} onArrowPress={onArrowPress('library')}>
                    <Icon className={styles['icon']} name={meta.inLibrary ? 'remove-from-library' : 'add-to-library'} />
                    <span>{meta.inLibrary ? t('REMOVE_FROM_LIB') : t('ADD_TO_LIB')}</span>
                </Button>
                <Button
                    focusKey={'detail-action-watched'}
                    className={classnames(styles['button'], styles['round'])}
                    title={meta.watched ? t('CTX_MARK_UNWATCHED') : t('CTX_MARK_WATCHED')}
                    onClick={onToggleWatched}
                    onArrowPress={onArrowPress('watched')}
                >
                    <Icon className={styles['icon']} name={meta.watched ? 'eye-off' : 'eye'} />
                </Button>
                <Button
                    focusKey={'detail-action-like'}
                    className={classnames(styles['button'], styles['round'])}
                    title={liked ? t('RATING_UNLIKE') : t('RATING_LIKE')}
                    disabled={!ratingReady}
                    onClick={onLiked}
                    onArrowPress={onArrowPress('like')}
                >
                    <Icon className={styles['icon']} name={liked ? 'thumbs-up' : 'thumbs-up-outline'} />
                </Button>
                <Button
                    focusKey={'detail-action-love'}
                    className={classnames(styles['button'], styles['round'])}
                    title={loved ? t('RATING_UNLOVE') : t('RATING_LOVE')}
                    disabled={!ratingReady}
                    onClick={onLoved}
                    onArrowPress={onArrowPress('love')}
                >
                    <Icon className={styles['icon']} name={loved ? 'heart' : 'heart-outline'} />
                </Button>
                {
                    share ?
                        <Button
                            focusKey={'detail-action-share'}
                            className={classnames(styles['button'], styles['round'])}
                            title={t('CTX_SHARE', { defaultValue: 'Share' })}
                            onClick={openShare}
                            onArrowPress={onArrowPress('share')}
                        >
                            <Icon className={styles['icon']} name={'share'} />
                        </Button>
                        :
                        null
                }
            </div>
            {
                shareOpen && share ?
                    <FullscreenDialog
                        title={t('CTX_SHARE', { defaultValue: 'Share' })}
                        actions={shareActions}
                        onClose={closeShare}
                    >
                        <SharePrompt url={share.href} />
                    </FullscreenDialog>
                    :
                    null
            }
        </div>
    );
};

export const TvDetailInfoPlaceholder = () => (
    <div className={classnames(styles['tv-detail-info'], styles['placeholder'])}>
        <div className={styles['placeholder-logo']} />
        <div className={styles['placeholder-line']} />
        <div className={styles['placeholder-text']} />
    </div>
);

export default TvDetailInfo;
