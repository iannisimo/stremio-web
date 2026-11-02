// Copyright (C) 2017-2024 Smart code 203358507

import React from 'react';
import classNames from 'classnames';
import Icon from '@stremio/stremio-icons/react';
import { useFocusable } from 'stremio/services/Navigation';
import styles from './SideDrawerButton.less';

type Props = {
    className: string,
    onClick: () => void,
};

const SideDrawerButton = ({ className, onClick }: Props) => {
    const { ref } = useFocusable({ focusKey: 'player-drawer-button' });
    const onMouseDown = (event: React.MouseEvent) => {
        // @ts-expect-error: Property 'videosMenuClosePrevented' does not exist on type 'MouseEvent'.
        event.nativeEvent.videosMenuClosePrevented = true;
    };
    const onKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') onClick();
    };

    return (
        <div ref={ref} tabIndex={-1} className={classNames(className, styles['side-drawer-button'])} onMouseDown={onMouseDown} onKeyDown={onKeyDown} onClick={onClick}>
            <Icon name={'chevron-back'} className={styles['icon']} />
        </div>
    );
};

export default SideDrawerButton;
