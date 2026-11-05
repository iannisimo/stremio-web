const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { useTranslation } = require('react-i18next');
const { useFocusable, FocusContext } = require('@noriginmedia/norigin-spatial-navigation');
const TvRailButton = require('./TvRailButton/TvRailButton');
const styles = require('./styles');

const TvRail = React.memo(React.forwardRef(({ className, focusKey, selected, tabs }, ref) => {
    const { t } = useTranslation();
    const { ref: focusRef } = useFocusable({
        focusKey,
        // always the current page's tab
        saveLastFocusedChild: false,
        preferredChildFocusKey: `${focusKey}:${selected}`,
    });
    const renderTab = (tab) => (
        <TvRailButton
            key={tab.id}
            focusKey={`${focusKey}:${tab.id}`}
            className={styles['rail-button']}
            selected={tab.id === selected}
            href={tab.href}
            logo={tab.logo}
            icon={tab.icon}
            label={t(tab.label)}
            onClick={tab.onClick}
        />
    );
    const topTabs = Array.isArray(tabs) ? tabs.filter((tab) => !tab.bottom) : [];
    const bottomTabs = Array.isArray(tabs) ? tabs.filter((tab) => tab.bottom) : [];
    return (
        <FocusContext.Provider value={focusKey}>
            {/* navigation measures this box: the rail at its collapsed width, even while it is expanded */}
            <div ref={focusRef} className={classnames(className, styles['rail-slot'])}>
                <nav ref={ref} className={classnames(styles['rail-container'], 'rail')}>
                    <div className={styles['tabs']}>{topTabs.map(renderTab)}</div>
                    {
                        bottomTabs.length > 0 ?
                            <div className={styles['footer']}>{bottomTabs.map(renderTab)}</div>
                            :
                            null
                    }
                </nav>
            </div>
        </FocusContext.Provider>
    );
}));

TvRail.displayName = 'TvRail';

TvRail.propTypes = {
    className: PropTypes.string,
    focusKey: PropTypes.string.isRequired,
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

module.exports = TvRail;
