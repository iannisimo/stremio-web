import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@stremio/stremio-icons/react';
import Button from 'stremio/components/Button';
import FullscreenDialog from 'stremio/components/FullscreenDialog';
import styles from './TvSeasonSwitcher.less';

type Props = {
    seasons: number[],
    season: number,
    onSelect: (season: number) => void,
};

const TvSeasonSwitcher = ({ seasons, season, onSelect }: Props) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const index = seasons.indexOf(season);

    const label = useCallback((value: number) => {
        return value > 0 ? t('SEASON_NUMBER', { season: value }) : t('SPECIAL', { defaultValue: 'Specials' });
    }, [t]);

    const onArrowPress = useCallback((direction: string) => {
        if (direction !== 'left' && direction !== 'right') return true;
        const next = seasons[index + (direction === 'left' ? -1 : 1)];
        if (next === undefined) return true;
        onSelect(next);
        return false;
    }, [seasons, index, onSelect]);

    const close = useCallback(() => setOpen(false), []);
    const actions = useMemo(() => seasons.map((value) => ({
        label: label(value),
        focusKey: `detail-season-option-${value}`,
        onClick: () => {
            onSelect(value);
            setOpen(false);
        },
    })), [seasons, label, onSelect]);

    return (
        <>
            <Button focusKey={'detail-season'} className={styles['switcher']} onClick={() => setOpen(true)} onArrowPress={onArrowPress}>
                <Icon className={styles['arrow']} name={'chevron-back'} />
                <span className={styles['label']}>{label(season)}</span>
                <Icon className={styles['arrow']} name={'chevron-forward'} />
            </Button>
            {
                open ?
                    <FullscreenDialog
                        title={t('SEASON')}
                        actions={actions}
                        initialFocusKey={`detail-season-option-${season}`}
                        onClose={close}
                    />
                    :
                    null
            }
        </>
    );
};

export default TvSeasonSwitcher;
