const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { useTranslation } = require('react-i18next');
const { FocusContext, useFocusGroup, mergeRefs } = require('stremio/services/Navigation');
const RailButton = require('./RailButton/RailButton');
const styles = require('./styles');

const Rail = React.memo(React.forwardRef(({ className, selected, tabs }, ref) => {
    const { t } = useTranslation();
    const group = useFocusGroup({
        focusKey: 'sidebar',
        saveLastFocusedChild: false,
        preferredChildFocusKey: selected ? `sidebar-${selected}` : undefined,
    });
    const setRef = React.useMemo(() => mergeRefs(group.ref, ref), [ref]);
    const renderTab = (tab) => (
        <RailButton
            key={tab.id}
            className={styles['rail-button']}
            selected={tab.id === selected}
            href={tab.href}
            logo={tab.logo}
            icon={tab.icon}
            label={t(tab.label)}
            focusKey={`sidebar-${tab.id}`}
            onClick={tab.onClick}
        />
    );
    const topTabs = Array.isArray(tabs) ? tabs.filter((tab) => !tab.bottom) : [];
    const bottomTabs = Array.isArray(tabs) ? tabs.filter((tab) => tab.bottom) : [];
    return (
        <FocusContext.Provider value={group.focusKey}>
            <nav ref={setRef} className={classnames(className, styles['rail-container'], 'rail')}>
                <div className={styles['tabs']}>{topTabs.map(renderTab)}</div>
                {
                    bottomTabs.length > 0 ?
                        <div className={styles['footer']}>{bottomTabs.map(renderTab)}</div>
                        :
                        null
                }
            </nav>
        </FocusContext.Provider>
    );
}));

Rail.displayName = 'Rail';

Rail.propTypes = {
    className: PropTypes.string,
    selected: PropTypes.string,
    tabs: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        logo: PropTypes.string,
        icon: PropTypes.string,
        href: PropTypes.string,
        bottom: PropTypes.bool,
        onClick: PropTypes.func
    }))
};

module.exports = Rail;
