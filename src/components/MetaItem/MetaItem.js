// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { useTranslation } = require('react-i18next');
const { useHover } = require('react-aria/useHover');
const filterInvalidDOMProps = require('filter-invalid-dom-props').default;
const { useNavigateWithOrigin } = require('stremio-router');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { default: Button } = require('stremio/components/Button');
const { default: Image } = require('stremio/components/Image');
const { useLongPressEnter } = require('stremio/services/Navigation');
const useBinaryState = require('stremio/common/useBinaryState');
const { default: getMetaDetailsHref } = require('stremio/common/getMetaDetailsHref');
const { ICON_FOR_TYPE } = require('stremio/common/CONSTANTS');
const MetaItemActions = require('./MetaItemActions');
const styles = require('./styles');

const MetaItem = React.memo(({ className, type, name, poster, posterShape, posterChangeCursor, progress, newVideos, options, deepLinks, href: customHref, dataset, optionOnSelect, onPlayClick, watched, live, metaItem, ...props }) => {
    const { t } = useTranslation();
    const artwork = poster && typeof poster === 'object' ? poster : { src: poster, shape: posterShape, changeCursor: posterChangeCursor };
    const { navigateWithOrigin } = useNavigateWithOrigin();
    const [menuOpen, onMenuOpen, onMenuClose] = useBinaryState(false);
    const { hoverProps, isHovered } = useHover({});
    const href = React.useMemo(() => {
        return typeof customHref === 'string' ? customHref : getMetaDetailsHref(deepLinks);
    }, [customHref, deepLinks]);
    const metaItemOnClick = React.useCallback((event) => {
        if (typeof props.onClick === 'function') {
            props.onClick(event);
        }

        if (!event.defaultPrevented && typeof onPlayClick === 'function') {
            event.preventDefault();
            onPlayClick(event);
            return;
        }

        if (
            !event.defaultPrevented &&
            event.button === 0 &&
            !event.altKey &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.shiftKey &&
            (!event.currentTarget.target || event.currentTarget.target === '_self') &&
            typeof href === 'string'
        ) {
            event.preventDefault();
            navigateWithOrigin(href);
        }
    }, [href, navigateWithOrigin, props.onClick, onPlayClick]);
    const menuOnSelect = React.useCallback((event) => {
        if (typeof optionOnSelect === 'function') {
            optionOnSelect({
                type: 'select-option',
                value: event.value,
                dataset: dataset,
                reactEvent: event.reactEvent,
                nativeEvent: event.nativeEvent
            });
        }
    }, [dataset, optionOnSelect]);
    const hasOptions = Array.isArray(options) && options.length > 0;
    const longPress = useLongPressEnter(onMenuOpen);
    const onSelectOption = React.useCallback((value) => menuOnSelect({ value, nativeEvent: {} }), [menuOnSelect]);
    const renderPosterFallback = React.useCallback(() => (
        <Icon
            className={styles['placeholder-icon']}
            name={ICON_FOR_TYPE.has(type) ? ICON_FOR_TYPE.get(type) : ICON_FOR_TYPE.get('other')}
        />
    ), [type]);
    return (
        <div {...hoverProps} {...longPress} className={classnames(className, styles['meta-item-container'], styles['poster-shape-poster'], styles[`poster-shape-${artwork.shape === 'square' ? 'poster' : artwork.shape}`], { 'active': menuOpen, 'hovered': isHovered })}>
            <Button title={name} href={href} {...filterInvalidDOMProps(props)} className={styles['meta-item-link']} onClick={metaItemOnClick}>
                <div className={classnames(styles['poster-container'], { 'poster-change-cursor': artwork.changeCursor })}>
                    {
                        watched ?
                            <div className={styles['watched-icon-layer']}>
                                <Icon className={styles['watched-icon']} name={'checkmark'} />
                            </div>
                            :
                            null
                    }
                    <div className={styles['poster-image-layer']}>
                        <Image
                            className={styles['poster-image']}
                            src={artwork.src}
                            alt={' '}
                            renderFallback={renderPosterFallback}
                        />
                        {
                            live ?
                                <div className={styles['live-badge-layer']}>
                                    <div className={styles['live-badge-label']}>{t('PLAYER_LIVE', { defaultValue: 'Live' })}</div>
                                </div>
                                :
                                null
                        }
                    </div>
                    {artwork.overlay}
                    {
                        progress > 0 ?
                            <div className={styles['progress-bar-layer']}>
                                <div className={styles['progress-bar']} style={{ width: `${progress}%` }} />
                                <div className={styles['progress-bar-background']} />
                            </div>
                            :
                            null
                    }
                    {
                        newVideos > 0 ?
                            <div className={styles['new-videos']}>
                                <div className={styles['layer']} />
                                <div className={styles['layer']} />
                                <div className={styles['layer']}>
                                    <Icon className={styles['icon']} name={'add'} />
                                    <div className={styles['label']}>
                                        {newVideos}
                                    </div>
                                </div>
                            </div>
                            :
                            null
                    }
                </div>
                {
                    (typeof name === 'string' && name.length > 0) || hasOptions ?
                        <div className={styles['title-bar-container']}>
                            <div className={styles['title-label']}>
                                {typeof name === 'string' && name.length > 0 ? name : ''}
                            </div>
                        </div>
                        :
                        null
                }
            </Button>
            {
                menuOpen ?
                    <MetaItemActions
                        name={name}
                        image={typeof artwork.src === 'string' ? artwork.src : undefined}
                        href={href}
                        metaItem={metaItem}
                        watched={watched}
                        options={options}
                        onSelectOption={onSelectOption}
                        onClose={onMenuClose}
                    />
                    :
                    null
            }
        </div>
    );
});

MetaItem.displayName = 'MetaItem';

MetaItem.propTypes = {
    className: PropTypes.string,
    type: PropTypes.string,
    name: PropTypes.string,
    poster: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
            src: PropTypes.string,
            shape: PropTypes.oneOf(['poster', 'landscape', 'square']),
            changeCursor: PropTypes.bool,
            overlay: PropTypes.node,
        }),
    ]),
    posterShape: PropTypes.oneOf(['poster', 'landscape', 'square']),
    posterChangeCursor: PropTypes.bool,
    progress: PropTypes.number,
    newVideos: PropTypes.number,
    options: PropTypes.array,
    href: PropTypes.string,
    deepLinks: PropTypes.shape({
        metaDetailsVideos: PropTypes.string,
        metaDetailsStreams: PropTypes.string,
        player: PropTypes.string
    }),
    dataset: PropTypes.object,
    optionOnSelect: PropTypes.func,
    onPlayClick: PropTypes.func,
    onClick: PropTypes.func,
    watched: PropTypes.bool,
    live: PropTypes.bool,
    metaItem: PropTypes.object,
};

module.exports = MetaItem;
