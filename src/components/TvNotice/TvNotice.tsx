import React from 'react';
import Icon from '@stremio/stremio-icons/react';
import Button from 'stremio/components/Button';
import { FocusContext, useFocusGroup } from 'stremio/services/Navigation';
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
    // shown on the right, e.g. a QR code
    side?: React.ReactNode,
    children?: React.ReactNode,
};

// Full-page notice in the TV style: logged-out pages, the addons notice.
const TvNotice = ({ icon, title, message, points, actions, side, children }: Props) => {
    const group = useFocusGroup<HTMLDivElement>();

    return (
        <FocusContext.Provider value={group.focusKey}>
            <div ref={group.ref} className={styles['tv-notice']} data-tv-start={true}>
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
                            <div className={styles['actions']}>
                                {
                                    actions.map((action) => (
                                        <Button key={action.label} className={styles['action']} href={action.href} onClick={action.onClick}>
                                            {action.label}
                                        </Button>
                                    ))
                                }
                            </div>
                            :
                            null
                    }
                </div>
                {side ? <div className={styles['side']}>{side}</div> : null}
            </div>
        </FocusContext.Provider>
    );
};

export default TvNotice;
