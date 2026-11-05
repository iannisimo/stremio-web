// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const { ModalsContainerProvider } = require('../ModalsContainerContext');
const { RouteFocusedProvider } = require('stremio/common/useRouteFocused');
const { FocusContext } = require('@noriginmedia/norigin-spatial-navigation');
const { usePageFocus } = require('stremio/services/Navigation');
const { TvServerUrlSlot } = require('stremio/App/TvServerUrlDialog');

const Route = ({ component, focused, focusKey }) => {
    const pageRef = usePageFocus(focusKey);
    return (
        <div ref={pageRef} className={'route-container'}>
            <FocusContext.Provider value={focusKey}>
                <RouteFocusedProvider value={focused}>
                    <ModalsContainerProvider>
                        <div className={'route-content'}>
                            {component}
                        </div>
                        <TvServerUrlSlot />
                    </ModalsContainerProvider>
                </RouteFocusedProvider>
            </FocusContext.Provider>
        </div>
    );
};

Route.propTypes = {
    component: PropTypes.node,
    focused: PropTypes.bool,
    focusKey: PropTypes.string.isRequired,
};

module.exports = Route;
