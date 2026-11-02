import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { FocusContext, useFocusGroup, mergeRefs } from 'stremio/services/Navigation';
import TvStatistics, { Statistics } from './TvStatistics';
const ControlBar = require('../ControlBar') as React.ComponentType<Record<string, unknown> & { ref?: React.Ref<HTMLElement> }>;

const STATISTICS_BUTTON = '[data-tv-statistics]';
const noop = () => undefined;

const statisticsButton = (target: EventTarget | null) => (target instanceof Element ? target.closest<HTMLElement>(STATISTICS_BUTTON) : null);

// Upstream's control bar as one remembered focus group. The statistics button
// doesn't open a menu: its panel shows while the button is focused or hovered.
const TvControlBar = forwardRef<HTMLElement, Record<string, unknown>>(({ statistics, ...props }, ref) => {
    const group = useFocusGroup<HTMLElement>({ focusKey: 'player-controls', saveLastFocusedChild: true });
    const setRef = useMemo(() => mergeRefs(group.ref, ref), [group.ref, ref]);
    const [focused, setFocused] = useState<HTMLElement | null>(null);
    const [hovered, setHovered] = useState<HTMLElement | null>(null);

    useEffect(() => {
        const root = group.ref.current;
        if (!root) return;
        const onFocusIn = (event: FocusEvent) => setFocused(statisticsButton(event.target));
        const onFocusOut = (event: FocusEvent) => {
            if (statisticsButton(event.target)) setFocused(null);
        };
        const onMouseOver = (event: MouseEvent) => setHovered(statisticsButton(event.target));
        const onMouseLeave = () => setHovered(null);
        root.addEventListener('focusin', onFocusIn);
        root.addEventListener('focusout', onFocusOut);
        root.addEventListener('mouseover', onMouseOver);
        root.addEventListener('mouseleave', onMouseLeave);
        return () => {
            root.removeEventListener('focusin', onFocusIn);
            root.removeEventListener('focusout', onFocusOut);
            root.removeEventListener('mouseover', onMouseOver);
            root.removeEventListener('mouseleave', onMouseLeave);
        };
    }, [group.ref]);

    const anchor = focused ?? hovered;

    return (
        <FocusContext.Provider value={group.focusKey}>
            <ControlBar ref={setRef} {...props} onToggleStatisticsMenu={noop} />
            {
                anchor !== null && statistics && props.statisticsAvailable ?
                    <TvStatistics statistics={statistics as Statistics} anchor={anchor} />
                    :
                    null
            }
        </FocusContext.Provider>
    );
});

TvControlBar.displayName = 'TvControlBar';

export default TvControlBar;
