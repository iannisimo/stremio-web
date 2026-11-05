import React, { useCallback } from 'react';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';

type Props = {
    className?: string,
    children: React.ReactNode,
};

// One row of chips: ← / → stay in it until its ends, and it scrolls to show
// the focused chip (rows wider than their column are clipped).
const TvChipRow = ({ className, children }: Props) => {
    const { ref, focusKey } = useFocusable<object, HTMLDivElement>();
    const onFocus = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
        if (event.target instanceof HTMLElement) event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }, []);
    return (
        <FocusContext.Provider value={focusKey}>
            <div ref={ref} className={className} onFocus={onFocus}>{children}</div>
        </FocusContext.Provider>
    );
};

export default TvChipRow;
