import React, { forwardRef } from 'react';
import TvPopup from './TvPopup';

type Options = {
    centered?: boolean,
};

type Wrapped = { className?: string, style?: React.CSSProperties };

// Wraps an upstream player menu in a TV popup. The wrapper takes the
// className, style and ref the player (and its Transition) hand over.
const withTvPopup = <P extends object>(Inner: React.ComponentType<P>, options: Options = {}) => {
    const Popup = forwardRef<HTMLDivElement, P & Wrapped>(({ className, style, ...props }, ref) => (
        <TvPopup ref={ref} className={className} style={style} {...options}>
            <Inner {...props as unknown as P} />
        </TvPopup>
    ));
    Popup.displayName = `TvPopup(${Inner.displayName ?? Inner.name ?? 'Menu'})`;
    return Popup;
};

export default withTvPopup;
