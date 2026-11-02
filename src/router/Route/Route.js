// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const { ModalsContainerProvider } = require('../ModalsContainerContext');
const { RouteFocusedProvider } = require('stremio/common/useRouteFocused');
const { useRouteFocusScope } = require('stremio/services/Navigation');

const Route = ({ component, focused, view }) => {
    const scope = useRouteFocusScope(view, focused);
    return (
        <div ref={scope.ref} className={'route-container'}>
            <RouteFocusedProvider value={focused}>
                <ModalsContainerProvider>
                    <div className={'route-content'}>
                        <scope.Provider>{component}</scope.Provider>
                    </div>
                </ModalsContainerProvider>
            </RouteFocusedProvider>
        </div>
    );
};

Route.propTypes = {
    component: PropTypes.node,
    focused: PropTypes.bool,
    view: PropTypes.number,
};

module.exports = Route;
