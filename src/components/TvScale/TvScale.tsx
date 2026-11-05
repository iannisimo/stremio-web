import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import Icon from '@stremio/stremio-icons/react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import styles from './TvScale.less';

type Props = {
    min: number,
    max: number,
    step: number,
    value: number,
    options: number[],
    tabIndex?: number,
    onChange: (value: number) => void,
};

// Same props as upstream's Scale: one focus stop, ← / → step through the
// options (also at the ends, so they don't leave it).
const TvScale = ({ value, options, onChange }: Props) => {
    const { t } = useTranslation();
    const index = options.indexOf(value);

    const stepBy = useCallback((delta: number) => {
        const next = options[Math.min(Math.max((index < 0 ? 0 : index) + delta, 0), options.length - 1)];
        if (next !== undefined && next !== value) onChange(next);
    }, [options, index, value, onChange]);

    const onArrowPress = useCallback((direction: string) => {
        if (direction !== 'left' && direction !== 'right') return true;
        stepBy(direction === 'left' ? -1 : 1);
        return false;
    }, [stepBy]);

    const { ref } = useFocusable<object, HTMLDivElement>({ onArrowPress });

    const atMin = index <= 0;
    const atMax = index === options.length - 1;

    return (
        <div ref={ref} className={styles['tv-scale']} tabIndex={-1} role={'slider'} aria-label={t('SETTINGS_UI_ZOOM')} aria-valuenow={value}>
            <button type={'button'} tabIndex={-1} className={classNames(styles['arrow'], { [styles['disabled']]: atMin })} onClick={() => stepBy(-1)}>
                <Icon className={styles['icon']} name={'chevron-back'} />
            </button>
            <div className={styles['value']}>{value}%</div>
            <button type={'button'} tabIndex={-1} className={classNames(styles['arrow'], { [styles['disabled']]: atMax })} onClick={() => stepBy(1)}>
                <Icon className={styles['icon']} name={'chevron-forward'} />
            </button>
        </div>
    );
};

export default TvScale;
