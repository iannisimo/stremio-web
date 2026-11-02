import React, { forwardRef, useEffect, useMemo } from 'react';
import classnames from 'classnames';
import { FocusContext, useFocusGroup, mergeRefs } from 'stremio/services/Navigation';
import styles from './TvPopup.less';

type Props = {
    className?: string,
    style?: React.CSSProperties,
    focusKey: string,
    // dims the player and centers the child; otherwise the child brings its own look
    centered?: boolean,
    // selector of what to focus first, ahead of the selected option
    initial?: string,
    children: React.ReactNode,
};

// What to focus on open, in order: explicit mark, selected option, first option.
const INITIAL = [
    '[tabindex="0"][data-initial-focus]',
    '[tabindex="0"][data-selected="true"]',
    '[tabindex="0"].selected:not(.disabled)',
    '[tabindex="0"][class*="selected"]:not(.disabled)',
    '[tabindex="0"][class*="active"]:not(.disabled)',
    '[tabindex="0"]:not(.disabled)',
];

// Player popup: a focus boundary that takes focus when it opens.
const TvPopup = forwardRef<HTMLDivElement, Props>(({ className, style, focusKey, centered, initial, children }, ref) => {
    const group = useFocusGroup<HTMLDivElement>({ focusKey, isFocusBoundary: true, saveLastFocusedChild: false });
    const setRef = useMemo(() => mergeRefs(group.ref, ref as React.Ref<HTMLElement>), [group.ref, ref]);

    // Transition keeps a closing popup mounted while it fades out; reopening
    // it then only swaps the class back, so focus on that too
    const open = !/-exit(\s|$)/.test(className ?? '');

    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(() => {
            const root = group.ref.current;
            if (!root) return;
            for (const selector of initial ? [initial, ...INITIAL] : INITIAL) {
                const target = root.querySelector<HTMLElement>(selector);
                if (target) {
                    target.focus();
                    return;
                }
            }
            group.focusSelf();
        }, 0);
        return () => clearTimeout(timer);
    }, [open]);

    return (
        <FocusContext.Provider value={group.focusKey}>
            <div ref={setRef} style={style} className={classnames(className, styles['tv-popup'], { [styles['centered']]: centered })}>
                {children}
            </div>
        </FocusContext.Provider>
    );
});

TvPopup.displayName = 'TvPopup';

export default TvPopup;
