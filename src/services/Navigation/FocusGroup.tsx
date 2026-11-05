import React from 'react';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';

type Props = {
    className?: string,
    focusKey?: string,
    // where focus goes the first time; after that the last focused child
    preferredChildFocusKey?: string,
    // false: always the preferred child
    saveLastFocusedChild?: boolean,
    children?: React.ReactNode,
};

// A div that groups focus stops: arrows move inside it first, and coming back
// lands on the last one focused.
const FocusGroup = ({ className, focusKey, preferredChildFocusKey, saveLastFocusedChild = true, children }: Props) => {
    const { ref, focusKey: key } = useFocusable<object, HTMLDivElement>({ focusKey, preferredChildFocusKey, saveLastFocusedChild });
    return (
        <FocusContext.Provider value={key}>
            <div ref={ref} className={className}>{children}</div>
        </FocusContext.Provider>
    );
};

export default FocusGroup;
