import React, { forwardRef } from 'react';
import { FocusContext, mergeRefs, useFocusGroup } from 'stremio/services/Navigation';

type Props = {
    className?: string,
    onScroll?: (event: React.UIEvent<HTMLDivElement>) => void,
    children?: React.ReactNode,
};

// The right pane as one focus group: coming over from the section list
// lands on the first option instead of the nearest one.
const TvPane = forwardRef<HTMLDivElement, Props>(({ className, onScroll, children }, ref) => {
    const group = useFocusGroup<HTMLDivElement>({ saveLastFocusedChild: false });
    return (
        <FocusContext.Provider value={group.focusKey}>
            <div ref={mergeRefs(ref, group.ref)} className={className} onScroll={onScroll}>
                {children}
            </div>
        </FocusContext.Provider>
    );
});

TvPane.displayName = 'TvPane';

export default TvPane;
