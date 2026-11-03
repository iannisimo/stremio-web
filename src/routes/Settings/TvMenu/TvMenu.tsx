import React, { useCallback, useMemo } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import Icon from '@stremio/stremio-icons/react';
import { Button } from 'stremio/components';
import { FocusContext, useFocusGroup, useRouteScope } from 'stremio/services/Navigation';
import { SECTIONS } from '../constants';
import styles from './TvMenu.less';

type Props = {
    selected: string,
    streamingServer: StreamingServer,
    onSelect: (event: React.SyntheticEvent<HTMLDivElement>) => void,
};

// Section list for the two-pane layout, same props as upstream's Menu.
// Focus picks the section, so moving down the list switches the right pane.
const TvMenu = ({ selected, onSelect }: Props) => {
    const { t } = useTranslation();
    const scope = useRouteScope();
    const keyOf = (id: string) => `${scope}-settings-${id}`;

    const items = useMemo(() => [
        { id: SECTIONS.GENERAL, label: t('SETTINGS_NAV_GENERAL'), icon: 'person-outline' },
        { id: SECTIONS.INTERFACE, label: t('INTERFACE'), icon: 'tv-outline' },
        { id: SECTIONS.PLAYER, label: t('SETTINGS_NAV_PLAYER'), icon: 'play-outline' },
        { id: SECTIONS.STREAMING, label: t('SETTINGS_NAV_STREAMING'), icon: 'network' },
    ], [t]);

    // Button takes no onFocus; catch it here and hand over the focused item.
    const onFocusCapture = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
        const item = (event.target as HTMLElement).closest<HTMLDivElement>('[data-section]');
        if (item) onSelect({ ...event, currentTarget: item } as React.SyntheticEvent<HTMLDivElement>);
    }, [onSelect]);

    const group = useFocusGroup<HTMLDivElement>({ preferredChildFocusKey: keyOf(selected), saveLastFocusedChild: false });

    return (
        <FocusContext.Provider value={group.focusKey}>
            <div ref={group.ref} className={styles['tv-menu']} data-tv-start={true} onFocusCapture={onFocusCapture}>
                <div className={styles['title']}>{t('SETTINGS')}</div>
                {
                    items.map(({ id, label, icon }) => (
                        <Button
                            key={id}
                            className={classNames(styles['item'], { [styles['selected']]: selected === id })}
                            focusKey={keyOf(id)}
                            title={label}
                            data-section={id}
                            onClick={onSelect}
                        >
                            <Icon className={styles['icon']} name={icon} />
                            <span className={styles['label']}>{label}</span>
                        </Button>
                    ))
                }
            </div>
        </FocusContext.Provider>
    );
};

export default TvMenu;
