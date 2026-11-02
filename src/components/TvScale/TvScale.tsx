import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import Icon from '@stremio/stremio-icons/react';
import { useFocusable } from 'stremio/services/Navigation';
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

// Same props as upstream's Scale. One focus stop: left/right step through
// the options, up/down leave it.
const TvScale = ({ value, options, onChange }: Props) => {
    const { t } = useTranslation();
    const index = options.indexOf(value);

    const stepBy = useCallback((delta: number) => {
        const next = options[Math.min(Math.max((index < 0 ? 0 : index) + delta, 0), options.length - 1)];
        if (next !== undefined && next !== value) onChange(next);
    }, [options, index, value, onChange]);

    const { ref } = useFocusable<object, HTMLDivElement>({
        onArrowPress: (direction) => {
            if (direction === 'left' || direction === 'right') {
                stepBy(direction === 'left' ? -1 : 1);
                return false;
            }
            return true;
        },
    });

    const atMin = index <= 0;
    const atMax = index === options.length - 1;

    return (
        <div ref={ref} className={styles['tv-scale']} tabIndex={-1} data-tv-arrows={true} role={'slider'} aria-label={t('SETTINGS_UI_ZOOM')} aria-valuenow={value}>
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
