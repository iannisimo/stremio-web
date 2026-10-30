const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { useTranslation } = require('react-i18next');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { FocusContext, useFocusGroup, mergeRefs } = require('stremio/services/Navigation');
const { default: Button } = require('stremio/components/Button');
const NavMenu = require('stremio/components/NavBar/HorizontalNavBar/NavMenu');
const RailButton = require('./RailButton/RailButton');
const tabStyles = require('./RailButton/styles');
const styles = require('./styles');

const Rail = React.memo(React.forwardRef(({ className, selected, tabs, profileMenu }, ref) => {
    const { t } = useTranslation();
    const group = useFocusGroup({
        focusKey: 'sidebar',
        saveLastFocusedChild: false,
        preferredChildFocusKey: selected ? `sidebar-${selected}` : undefined,
    });
    const setRef = React.useMemo(() => mergeRefs(group.ref, ref), [ref]);
    const renderProfileLabel = React.useCallback(({ ref, className, onClick, children }) => (
        <Button ref={ref} className={classnames(className, tabStyles['rail-button-container'], styles['rail-button'])} title={t('PROFILE', { defaultValue: 'Profile' })} onClick={onClick}>
            <Icon className={tabStyles['icon']} name={'person-outline'} />
            <div className={tabStyles['label']}>{t('PROFILE', { defaultValue: 'Profile' })}</div>
            {children}
        </Button>
    ), [t]);
    return (
        <FocusContext.Provider value={group.focusKey}>
            <nav ref={setRef} className={classnames(className, styles['rail-container'], 'rail')}>
                <div className={styles['tabs']}>
                    {
                        Array.isArray(tabs) ?
                            tabs.map((tab, index) => (
                                <RailButton
                                    key={index}
                                    className={styles['rail-button']}
                                    selected={tab.id === selected}
                                    href={tab.href}
                                    logo={tab.logo}
                                    icon={tab.icon}
                                    label={t(tab.label)}
                                    focusKey={`sidebar-${tab.id}`}
                                    onClick={tab.onClick}
                                />
                            ))
                            :
                            null
                    }
                </div>
                {
                    profileMenu ?
                        <div className={styles['footer']}>
                            <NavMenu direction={'top-right'} renderLabel={renderProfileLabel} />
                        </div>
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
    profileMenu: PropTypes.bool,
    tabs: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        logo: PropTypes.string,
        icon: PropTypes.string,
        href: PropTypes.string,
        onClick: PropTypes.func
    }))
};

module.exports = Rail;
