// Copyright (C) 2017-2023 Smart code 203358507

import React, { memo, useCallback, useMemo, useState } from 'react';
import classnames from 'classnames';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import TvRail from 'stremio/components/TvRail';
import TvPlayUrlDialog from 'stremio/components/TvPlayUrlDialog';
import { usePageStartFocus, useRailBack, useInSuspenseFallback } from 'stremio/services/Navigation';
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
    // first focus on the page; the rail when not given
    startFocusKey?: string,
    children?: React.ReactNode,
};

const MainNavBars = memo(({ className, route, startFocusKey, children }: Props) => {
    const navRef = React.useRef(null);
    // A page's loading fallback can show next to the page itself (hidden):
    // its own keys, and it leaves focus and Back to the page.
    const inFallback = useInSuspenseFallback();
    const keyPrefix = inFallback ? `${route}:fallback` : `${route}`;
    const railFocusKey = `${keyPrefix}:rail`;
    // → from the rail comes back to where the page was left, else its start
    const { ref: contentRef, focusKey: contentFocusKey } = useFocusable<object, HTMLDivElement>({
        focusKey: `${keyPrefix}:content`,
        saveLastFocusedChild: true,
        preferredChildFocusKey: startFocusKey,
    });
    usePageStartFocus({ enabled: !inFallback, startFocusKey, returnFocusKey: contentFocusKey, fallbackFocusKey: railFocusKey });
    useRailBack({ enabled: !inFallback, railFocusKey, isHome: route === 'board' });

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
                focusKey={railFocusKey}
                selected={route}
                tabs={tabs}
            />
            <div ref={contentRef} className={styles['nav-content-container']}>
                <FocusContext.Provider value={contentFocusKey}>{children}</FocusContext.Provider>
            </div>
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
