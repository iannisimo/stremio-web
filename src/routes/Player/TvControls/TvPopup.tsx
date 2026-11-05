import React, { forwardRef, useEffect } from 'react';
import classnames from 'classnames';
import { useFocusable, FocusContext, getCurrentFocusKey, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { mergeRefs } from 'stremio/services/Input';
import { FOCUS_KEY_ATTRIBUTE } from 'stremio/services/Navigation';
import styles from './TvPopup.less';

type Props = {
    className?: string,
    style?: React.CSSProperties,
    // dims the player and centers the child; otherwise the child brings its own look
    centered?: boolean,
    children: React.ReactNode,
};

const WITH_KEY = `[${FOCUS_KEY_ATTRIBUTE}]`;
const SELECTED = ['.selected', '[class*="selected"]', '[class*="active"]'].map((selector) => `${selector}${WITH_KEY}`).join(', ');

// Where a popup opens: the control the menu focused itself, else its selected
// option, else its first one.
const openingKey = (root: HTMLElement) => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && root.contains(active) && active.matches(WITH_KEY)) {
        return active.getAttribute(FOCUS_KEY_ATTRIBUTE);
    }
    return root.querySelector(SELECTED)?.getAttribute(FOCUS_KEY_ATTRIBUTE) ?? null;
};

// Arrows stay inside; closing gives focus back to what had it.
const TvPopup = forwardRef<HTMLDivElement, Props>(({ className, style, centered, children }, ref) => {
    const { ref: focusRef, focusKey, focusSelf } = useFocusable<object, HTMLDivElement>({ isFocusBoundary: true });

    useEffect(() => {
        const opener = getCurrentFocusKey();
        const key = focusRef.current ? openingKey(focusRef.current) : null;
        if (key) setFocus(key);
        else focusSelf();
        return () => {
            if (opener) setFocus(opener);
        };
    }, []);

    return (
        <FocusContext.Provider value={focusKey}>
            <div ref={mergeRefs(ref, focusRef)} style={style} className={classnames(className, styles['tv-popup'], { [styles['centered']]: centered })}>
                {children}
            </div>
        </FocusContext.Provider>
    );
});

TvPopup.displayName = 'TvPopup';

export default TvPopup;
