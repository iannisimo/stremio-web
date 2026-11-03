// Copyright (C) 2017-2026 Smart code 203358507

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'stremio/components';
import { languages } from 'stremio/common';
import classNames from 'classnames';
import styles from './SubtitleVariant.less';

type SubtitlesTrack = {
    id: string,
    addonSubtitleId?: string,
    lang: string,
    origin: string,
    label?: string,
    url?: string,
    fallbackUrl?: string,
    embedded?: boolean,
    local?: boolean,
    exclusive?: boolean,
    ass?: boolean,
};

type Props = {
    track: SubtitlesTrack,
    selected: boolean,
    onSelect: (track: SubtitlesTrack) => void,
};

const hasValidLabel = (label?: string) => label && label.length > 0 && !label.startsWith('http');
const ASS_BADGE = 'ASS';

const SubtitleVariant = ({ track, selected, onSelect }: Props) => {
    const { t } = useTranslation();

    const downloadUrl = track.fallbackUrl || track.url;
    const variantLabel = hasValidLabel(track.label) ? track.label : languages.label(track.lang);
    const hoverTitle = hasValidLabel(track.label)
        ? track.label
        : downloadUrl?.split('/').pop()?.split('?')[0] || variantLabel;

    const onSelectClick = useCallback(() => {
        onSelect(track);
    }, [onSelect, track]);

    return (
        <Button
            title={hoverTitle}
            onClick={onSelectClick}
            className={classNames(styles['variant-option'], { 'selected': selected })}
        >
            <div className={styles['info']}>
                <div className={styles['variant-title']}>
                    <div className={styles['variant-label']}>
                        {variantLabel}
                    </div>
                    {track.ass ? <div className={styles['ass-badge']}>{ASS_BADGE}</div> : null}
                </div>
                <div className={styles['variant-origin']}>
                    {t(track.origin)}
                </div>
            </div>
            {selected ? <div className={styles['icon']} /> : null}
        </Button>
    );
};

export default SubtitleVariant;
