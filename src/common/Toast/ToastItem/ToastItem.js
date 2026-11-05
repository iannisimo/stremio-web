// Copyright (C) 2017-2023 Smart code 203358507

const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { default: Icon } = require('@stremio/stremio-icons/react');
const { Button } = require('stremio/components');
const styles = require('./styles');

const ToastItem = ({ title, message, dataset, onSelect, onClose, ...props }) => {
    const type = React.useMemo(() => {
        return ['success', 'alert', 'info', 'error'].includes(props.type) ?
            props.type
            :
            'success';
    }, [props.type]);
    const icon = React.useMemo(() => {
        return typeof props.icon === 'string' ? props.icon :
            type === 'success' ? 'checkmark' :
                type === 'error' ? 'close' :
                    type === 'info' ? 'about' :
                        null;
    }, [type, props.icon]);
    const toastOnClick = React.useCallback((event) => {
        if (!event.nativeEvent.selectToastPrevented && typeof onSelect === 'function') {
            onSelect({
                type: 'select',
                dataset: dataset,
                reactEvent: event,
                nativeEvent: event.nativeEvent
            });
        }
        if (!event.nativeEvent.closeToastPrevented && typeof onClose === 'function') {
            onClose({
                type: 'close',
                dataset: dataset,
                reactEvent: event,
                nativeEvent: event.nativeEvent
            });
        }
    }, [dataset, onSelect, onClose]);
    return (
        // HTPC fork: never a focus stop, no close button (toasts time out)
        <Button className={classnames(styles['toast-item-container'], styles[type])} tabIndex={-1} onClick={toastOnClick}>
            {
                typeof icon === 'string' && icon.length > 0 ?
                    <div className={styles['icon-container']}>
                        <Icon className={styles['icon']} name={icon} />
                    </div>
                    :
                    null
            }
            <div className={styles['info-container']}>
                {
                    typeof title === 'string' && title.length > 0 ?
                        <div className={styles['title-container']}>{title}</div>
                        :
                        null
                }
                {
                    typeof message === 'string' && message.length > 0 ?
                        <div className={styles['message-container']}>{message}</div>
                        :
                        null
                }
            </div>
        </Button>
    );
};

ToastItem.propTypes = {
    type: PropTypes.oneOf(['success', 'alert', 'info', 'error']),
    title: PropTypes.string,
    message: PropTypes.string,
    icon: PropTypes.string,
    dataset: PropTypes.object,
    onSelect: PropTypes.func,
    onClose: PropTypes.func
};

module.exports = ToastItem;
