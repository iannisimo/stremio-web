// Copyright (C) 2017-2023 Smart code 203358507

import React, { memo, useCallback, useMemo, useState } from 'react';
import classnames from 'classnames';
import TvRail from 'stremio/components/TvRail';
import TvPlayUrlDialog from 'stremio/components/TvPlayUrlDialog';
import styles from './MainNavBars.less';

const TABS = [
    { id: 'search', label: 'Search', icon: 'search', href: '/search' },
    { id: 'board', label: 'Home', icon: 'home', href: '/' },
    { id: 'discover', label: 'Discover', icon: 'discover', href: '/discover' },
    { id: 'library', label: 'Library', icon: 'library', href: '/library' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar', href: '/calendar' },
    { id: 'addons', label: 'ADDONS', icon: 'addons', href: '/addons' },
    { id: 'play-url', label: 'PLAY_URL_MAGNET_LINK', icon: 'magnet-link', bottom: true },
    { id: 'settings', label: 'SETTINGS', icon: 'settings', href: '/settings', bottom: true },
];

type Props = {
    className: string,
    route?: string,
    query?: string,
    children?: React.ReactNode,
};

const MainNavBars = memo(({ className, route, children }: Props) => {
    const navRef = React.useRef(null);
    const contentRef = React.useRef(null);

    const [playUrlOpen, setPlayUrlOpen] = useState(false);
    const closePlayUrl = useCallback(() => setPlayUrlOpen(false), []);
    const tabs = useMemo(() => TABS.map((tab) => (
        tab.id === 'play-url' ? { ...tab, onClick: () => setPlayUrlOpen(true) } : tab
    )), []);

    return (
        <div className={classnames(className, styles['main-nav-bars-container'])}>
            <TvRail
                ref={navRef}
                className={styles['vertical-nav-bar']}
                selected={route}
                tabs={tabs}
            />
            <div ref={contentRef} className={styles['nav-content-container']}>{children}</div>
            {
                playUrlOpen ?
                    <TvPlayUrlDialog onClose={closePlayUrl} />
                    :
                    null
            }
        </div>
    );
});

export default MainNavBars;
