import React, { forwardRef, useCallback } from 'react';
import { useFocusable, FocusContext, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { mergeRefs } from 'stremio/services/Input';

const BACK_KEYS = ['Escape', 'Backspace', 'BrowserBack'];

type Props = {
    className?: string,
    // where Back goes
    backFocusKey: string,
    onScroll?: (event: React.UIEvent<HTMLDivElement>) => void,
    children?: React.ReactNode,
};

// The right pane of the two-pane layout. Each section is new content, so
// coming back starts at its top instead of the last control.
const TvPane = forwardRef<HTMLDivElement, Props>(({ className, backFocusKey, onScroll, children }, ref) => {
    const { ref: focusRef, focusKey } = useFocusable<object, HTMLDivElement>({ focusKey: 'settings:pane', saveLastFocusedChild: false });

    const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!BACK_KEYS.includes(event.key) || event.defaultPrevented || event.repeat) return;
        // Backspace edits text fields
        if (event.target instanceof HTMLElement && event.target.matches('input, textarea, [data-text-entry]')) return;
        event.preventDefault();
        setFocus(backFocusKey);
    }, [backFocusKey]);

    return (
        <FocusContext.Provider value={focusKey}>
            <div ref={mergeRefs(ref, focusRef)} className={className} onScroll={onScroll} onKeyDown={onKeyDown}>
                {children}
            </div>
        </FocusContext.Provider>
    );
});

TvPane.displayName = 'TvPane';

export default TvPane;
