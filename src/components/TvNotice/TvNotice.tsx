import React from 'react';
import Icon from '@stremio/stremio-icons/react';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import Button from 'stremio/components/Button';
import styles from './TvNotice.less';

type Point = {
    icon: string,
    text: string,
};

type Action = {
    label: string,
    href?: string,
    onClick?: () => void,
};

type Props = {
    icon: string,
    title: string,
    message?: string,
    points?: Point[],
    actions?: Action[],
    // the actions' focus container, for the page's start focus
    focusKey?: string,
    // shown on the right, e.g. a QR code
    side?: React.ReactNode,
    children?: React.ReactNode,
};

const NoticeAction = ({ action }: { action: Action }) => {
    const { ref } = useFocusable();
    return (
        <Button ref={ref} className={styles['action']} href={action.href} onClick={action.onClick}>
            {action.label}
        </Button>
    );
};

const NoticeActions = ({ actions, focusKey: givenFocusKey }: { actions: Action[], focusKey?: string }) => {
    const { ref, focusKey } = useFocusable<object, HTMLDivElement>({ focusKey: givenFocusKey });
    return (
        <FocusContext.Provider value={focusKey}>
            <div ref={ref} className={styles['actions']}>
                {actions.map((action) => <NoticeAction key={action.label} action={action} />)}
            </div>
        </FocusContext.Provider>
    );
};

// Full-page notice in the TV style: logged-out pages, the addons notice.
const TvNotice = ({ icon, title, message, points, actions, focusKey, side, children }: Props) => {
    return (
        <div className={styles['tv-notice']}>
            <div className={styles['text']}>
                <Icon className={styles['icon']} name={icon} />
                <h1 className={styles['title']}>{title}</h1>
                {message ? <p className={styles['message']}>{message}</p> : null}
                {
                    points && points.length > 0 ?
                        <div className={styles['points']}>
                            {
                                points.map((point) => (
                                    <div key={point.text} className={styles['point']}>
                                        <Icon className={styles['point-icon']} name={point.icon} />
                                        <span>{point.text}</span>
                                    </div>
                                ))
                            }
                        </div>
                        :
                        null
                }
                {children}
                {
                    actions && actions.length > 0 ?
                        <NoticeActions actions={actions} focusKey={focusKey} />
                        :
                        null
                }
            </div>
            {side ? <div className={styles['side']}>{side}</div> : null}
        </div>
    );
};

export default TvNotice;
