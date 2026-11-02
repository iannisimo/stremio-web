import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './TvStatistics.less';

export type Statistics = {
    peers: number | null,
    speed: number | null,
    completed: number | null,
    infoHash: string | null,
};

type Props = {
    statistics: Statistics,
    // the statistics button
    anchor: HTMLElement,
};

// Read-only stream statistics shown while the statistics button is focused or hovered.
const TvStatistics = ({ statistics, anchor }: Props) => {
    const { t } = useTranslation();
    const container = anchor.closest('[class*="player-container-"]');
    if (!container) return null;

    // right-aligned with the button, above the whole bar (seek bar included)
    const bar = anchor.closest('[class*="control-bar-container-"]') ?? anchor;
    const box = container.getBoundingClientRect();
    const style = {
        right: box.right - anchor.getBoundingClientRect().right,
        bottom: box.bottom - bar.getBoundingClientRect().top + 8,
    };

    return (
        <div className={styles['tv-statistics']} style={style}>
            <div className={styles['title']}>{t('PLAYER_STATISTICS')}</div>
            <div className={styles['stats']}>
                <div className={styles['stat']}>
                    <div className={styles['value']}>{statistics.peers ?? '-'}</div>
                    <div className={styles['label']}>{t('PLAYER_PEERS')}</div>
                </div>
                <div className={styles['stat']}>
                    <div className={styles['value']}>{statistics.speed ?? '-'} <span className={styles['unit']}>{t('MB_S')}</span></div>
                    <div className={styles['label']}>{t('PLAYER_SPEED')}</div>
                </div>
                {
                    statistics.completed !== null ?
                        <div className={styles['stat']}>
                            <div className={styles['value']}>{Math.min(statistics.completed, 100)} <span className={styles['unit']}>%</span></div>
                            <div className={styles['label']}>{t('PLAYER_COMPLETED')}</div>
                        </div>
                        :
                        null
                }
            </div>
            {
                statistics.infoHash ?
                    <div className={styles['hash']}>{statistics.infoHash}</div>
                    :
                    null
            }
        </div>
    );
};

export default TvStatistics;
