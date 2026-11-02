import React from 'react';
import { FocusContext, useFocusGroup } from 'stremio/services/Navigation';
import './tvPlayer.less';

// Keeps remote navigation inside the player. Wrap the exported component.
const withTvPlayerRoot = <P extends object>(Player: React.ComponentType<P>) => {
    const Root = (props: P) => {
        const group = useFocusGroup<HTMLDivElement>({ focusKey: 'player-root', isFocusBoundary: true, saveLastFocusedChild: false });
        return (
            <FocusContext.Provider value={group.focusKey}>
                <div ref={group.ref} style={{ display: 'contents' }} data-tv-own-focus={true}>
                    <Player {...props} />
                </div>
            </FocusContext.Provider>
        );
    };
    return Root;
};

export default withTvPlayerRoot;
