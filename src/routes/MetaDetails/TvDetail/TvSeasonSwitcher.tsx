import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@stremio/stremio-icons/react';
import TvFullscreenDialog from 'stremio/components/TvFullscreenDialog';
import { FocusButton as Button } from 'stremio/services/Navigation';
import styles from './TvSeasonSwitcher.less';

type Props = {
    seasons: number[],
    season: number,
    onSelect: (season: number) => void,
};

const seasonFocusKey = (value: number) => `detail:season:${value}`;

const TvSeasonSwitcher = ({ seasons, season, onSelect }: Props) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    const label = useCallback((value: number) => {
        return value > 0 ? t('SEASON_NUMBER', { season: value }) : t('SPECIAL', { defaultValue: 'Specials' });
    }, [t]);

    const close = useCallback(() => setOpen(false), []);
    const actions = useMemo(() => seasons.map((value) => ({
        label: label(value),
        focusKey: seasonFocusKey(value),
        onClick: () => {
            onSelect(value);
            setOpen(false);
        },
    })), [seasons, label, onSelect]);

    return (
        <>
            <Button className={styles['switcher']} onClick={() => setOpen(true)}>
                <Icon className={styles['arrow']} name={'chevron-back'} />
                <span className={styles['label']}>{label(season)}</span>
                <Icon className={styles['arrow']} name={'chevron-forward'} />
            </Button>
            {
                open ?
                    <TvFullscreenDialog
                        title={t('SEASON')}
                        actions={actions}
                        preferredChildFocusKey={seasonFocusKey(season)}
                        onClose={close}
                    />
                    :
                    null
            }
        </>
    );
};

export default TvSeasonSwitcher;
