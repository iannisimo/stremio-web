const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { Image } = require('stremio/components');
const styles = require('./styles');
const { Link } = require('react-router-dom');
const { useFocusable } = require('@noriginmedia/norigin-spatial-navigation');

const TvRailButton = ({ className, focusKey, logo, icon, label, href, selected, onClick }) => {
    const { ref } = useFocusable({ focusKey });
    const onKeyDown = React.useCallback((event) => {
        if (event.key === 'Enter' && !event.repeat) {
            event.preventDefault();
            event.currentTarget.click();
        }
    }, []);
    const renderLogoFallback = React.useCallback(() => (
        typeof icon === 'string' && icon.length > 0 ?
            <Icon className={styles['icon']} name={icon} />
            :
            null
    ), [icon]);
    const onDoubleClick = () => {
        const scrollableElements = document.querySelectorAll('div');

        scrollableElements.forEach((element) => {
            if (element.scrollTop > 0) {
                element.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    };
    const Element = typeof href === 'string' ? Link : 'div';
    const linkProps = typeof href === 'string' ? { to: href } : { role: 'button' };
    const iconName = selected || typeof href !== 'string' ? icon : `${icon}-outline`;
    return (
        <Element ref={ref} className={classnames(className, styles['rail-button-container'], { 'selected': selected })} title={label} tabIndex={-1} {...linkProps} onClick={onClick} onKeyDown={onKeyDown} onDoubleClick={onDoubleClick}>
            {
                typeof logo === 'string' && logo.length > 0 ?
                    <Image
                        className={styles['logo']}
                        src={logo}
                        alt={' '}
                        renderFallback={renderLogoFallback}
                    />
                    :
                    typeof icon === 'string' && icon.length > 0 ?
                        <Icon className={styles['icon']} name={iconName} />
                        :
                        null
            }
            {
                typeof label === 'string' && label.length > 0 ?
                    <div className={styles['label']}>{label}</div>
                    :
                    null
            }
        </Element>
    );
};

TvRailButton.propTypes = {
    className: PropTypes.string,
    focusKey: PropTypes.string.isRequired,
    logo: PropTypes.string,
    icon: PropTypes.string,
    label: PropTypes.string,
    href: PropTypes.string,
    selected: PropTypes.bool,
    onClick: PropTypes.func
};

module.exports = TvRailButton;
