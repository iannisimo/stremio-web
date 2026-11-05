// Copyright (C) 2017-2024 Smart code 203358507

import React, { MouseEvent, memo, useCallback, useEffect, useRef } from 'react';
import classNames from 'classnames';
// HTPC fork: focus stops (upstream: Button from 'stremio/components')
import { FocusButton as Button } from 'stremio/services/Navigation';
import styles from './Chip.less';

type Props = {
    label: string,
    value: string,
    active: boolean,
    onSelect: (value: string) => void,
};

const Chip = memo(({ label, value, active, onSelect }: Props) => {
    const ref = useRef<HTMLElement>(null);

    const onClick = useCallback(({ currentTarget }: MouseEvent<HTMLElement>) => {
        const value = currentTarget.dataset['value'];
        value && onSelect(value);
    }, [onselect]);

    // HTPC fork: a focused chip is brought fully into view, clear of the edge fade
    const onFocus = useCallback(() => {
        ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }, []);

    useEffect(() => {
        active && ref.current?.scrollIntoView({
            block: 'nearest',
            inline: 'center',
            behavior: 'smooth',
        });
    }, [active]);

    return (
        <Button
            ref={ref}
            key={value}
            className={classNames(styles['chip'], { [styles['active']]: active })}
            tabIndex={0}
            data-value={value}
            onClick={onClick}
            onFocus={onFocus}
        >
            {label}
        </Button>
    );
});

export default Chip;
