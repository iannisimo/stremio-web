// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { useCore } = require('stremio/core');
const { useProfile, usePlatform, useToast } = require('stremio/common');
const { useFocusable } = require('@noriginmedia/norigin-spatial-navigation');
const { Button, Image } = require('stremio/components');
const ActionButton = require('stremio/components/MetaPreview/ActionButton');
const StreamPlaceholder = require('./StreamPlaceholder');
const styles = require('./styles');

const Stream = ({ className = '', compact = false, isEpg = false, videoId = undefined, videoReleased = undefined, addonName, name, description, thumbnail = undefined, progress, deepLinks, externalPlayerCallbackCanMarkWatched, focusKey, ...props }) => {
    const { ref: focusRef } = useFocusable({ focusKey });
    const profile = useProfile();
    const toast = useToast();
    const platform = usePlatform();
    const core = useCore();

    const href = React.useMemo(() => {
        return deepLinks ?
            deepLinks.externalPlayer ?
                deepLinks.externalPlayer.web ?
                    deepLinks.externalPlayer.web
                    :
                    deepLinks.externalPlayer.openPlayer ?
                        deepLinks.externalPlayer.openPlayer[platform.name] ?
                            deepLinks.externalPlayer.openPlayer[platform.name]
                            :
                            deepLinks.externalPlayer.playlist
                        :
                        deepLinks.player
                :
                deepLinks.player
            :
            null;
    }, [deepLinks]);

    const download = React.useMemo(() => {
        return href === deepLinks?.externalPlayer?.playlist ?
            deepLinks.externalPlayer.fileName
            :
            null;
    }, [href, deepLinks]);

    const target = React.useMemo(() => {
        return href === deepLinks?.externalPlayer?.web ?
            '_blank'
            :
            null;
    }, [href, deepLinks]);

    const markVideoAsWatched = React.useCallback(() => {
        if (typeof videoId === 'string') {
            core.transport.dispatch({
                action: 'MetaDetails',
                args: {
                    action: 'MarkVideoAsWatched',
                    args: [{ id: videoId, released: videoReleased }, true]
                }
            });
        }
    }, [videoId, videoReleased]);

    const onClick = React.useCallback((event) => {
        if (event.nativeEvent.togglePopupPrevented) {
            return;
        }

        if (profile.settings.playerType !== null) {
            if (profile.settings.playerType !== 'infuse' || !platform.shell.active || !externalPlayerCallbackCanMarkWatched) {
                markVideoAsWatched();
            }
            toast.show({
                type: 'success',
                title: 'Stream opened in external player',
                timeout: 4000
            });
        }

        if (typeof props.onClick === 'function') {
            props.onClick(event);
        }
    }, [props.onClick, profile.settings.playerType, platform.shell.active, externalPlayerCallbackCanMarkWatched, markVideoAsWatched]);

    const renderThumbnailFallback = React.useCallback(() => (
        <Icon className={styles['placeholder-icon']} name={'ic_broken_link'} />
    ), []);

    const renderLabel = React.useMemo(() => function renderLabel({ className, children, ...props }) {
        if (compact) {
            return <ActionButton ref={focusRef} className={classnames(className, styles['stream-action'])} icon={'play'} label={name || addonName} variant={'wide'} href={href} target={target} download={download} onClick={onClick} {...props}>
                {children}
            </ActionButton>;
        }

        return (
            <Button ref={focusRef} className={classnames(className, styles['stream-container'])} title={addonName} href={href} target={target} download={download} onClick={onClick} {...props}>
                <div className={styles['info-container']}>
                    {
                        typeof thumbnail === 'string' && thumbnail.length > 0 ?
                            <div className={styles['thumbnail-container']} title={name || addonName}>
                                <Image
                                    className={styles['thumbnail']}
                                    src={thumbnail}
                                    alt={' '}
                                    renderFallback={renderThumbnailFallback}
                                />
                            </div>
                            :
                            <div className={styles['addon-name-container']} title={name || addonName}>
                                <div className={styles['addon-name']}>{name || addonName}</div>
                            </div>
                    }
                    {
                        progress !== null && !isNaN(progress) && progress > 0 ?
                            <div className={styles['progress-bar-container']}>
                                <div className={styles['progress-bar']} style={{ width: `${progress}%` }} />
                                <div className={styles['progress-bar-background']} />
                            </div>
                            :
                            null
                    }
                </div>
                <div className={styles['description-container']} title={description}>{description}</div>
                <Icon className={styles['icon']} name={'play'} />
                {children}
            </Button>
        );
    }, [compact, thumbnail, progress, addonName, name, description, href, target, download, onClick]);

    // HTPC fork: no popup menu; long press / right click opens our row actions
    return renderLabel({ className });
};

Stream.Placeholder = StreamPlaceholder;

Stream.propTypes = {
    className: PropTypes.string,
    focusKey: PropTypes.string,
    compact: PropTypes.bool,
    isEpg: PropTypes.bool,
    videoId: PropTypes.string,
    videoReleased: PropTypes.instanceOf(Date),
    addonName: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    thumbnail: PropTypes.string,
    progress: PropTypes.number,
    deepLinks: PropTypes.shape({
        player: PropTypes.string,
        externalPlayer: PropTypes.shape({
            download: PropTypes.string,
            magnet: PropTypes.string,
            streaming: PropTypes.string,
            playlist: PropTypes.string,
            fileName: PropTypes.string,
            web: PropTypes.string,
            openPlayer: PropTypes.shape({
                ios: PropTypes.string,
                android: PropTypes.string,
                windows: PropTypes.string,
                macos: PropTypes.string,
                linux: PropTypes.string,
            })
        })
    }),
    externalPlayerCallbackCanMarkWatched: PropTypes.bool,
    onClick: PropTypes.func
};

module.exports = Stream;
