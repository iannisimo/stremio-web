// Copyright (C) 2017-2024 Smart code 203358507

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import classNames from 'classnames';
import { useNavigateWithOrigin } from 'stremio-router';
// HTPC fork: a day's episodes are a focus group (upstream: a plain div)
import { FocusGroup } from 'stremio/services/Navigation';
import Episode from '../../Episode';
import useCalendarDate from '../../useCalendarDate';
import styles from './Item.less';

export const dayFocusKey = (day: number) => `calendar:day:${day}`;

type Props = {
    selected: CalendarDate | null,
    monthInfo: CalendarMonthInfo,
    date: CalendarDate,
    items: CalendarContentItem[],
    profile: Profile,
    onClick: (date: CalendarDate) => void,
};

const Item = ({ selected, monthInfo, date, items, profile, onClick }: Props) => {
    const ref = useRef<HTMLDivElement>(null);
    const { navigateWithOrigin } = useNavigateWithOrigin();
    const { toDayMonth } = useCalendarDate(profile);

    const [active, today] = useMemo(() => [
        date.day === selected?.day,
        date.day === monthInfo.today,
    ], [selected, monthInfo, date]);

    const onItemClick = () => {
        onClick && onClick(date);
    };

    const onVideoClick = useCallback((event: React.MouseEvent<HTMLDivElement>, target: string) => {
        event.preventDefault();
        event.stopPropagation();
        navigateWithOrigin(target);
    }, [navigateWithOrigin]);

    useEffect(() => {
        active && ref.current?.scrollIntoView({
            block: 'start',
            behavior: 'smooth',
        });
    }, [active]);

    return (
        <div
            ref={ref}
            className={classNames(styles['item'], { [styles['active']]: active, [styles['today']]: today })}
            key={date.day}
            onClick={onItemClick}
        >
            <div className={styles['heading']}>
                {toDayMonth(date)}
            </div>
            <FocusGroup className={styles['body']} focusKey={dayFocusKey(date.day)}>
                {
                    items.map((video) => (
                        <Episode
                            key={video.id}
                            {...video}
                            hideSpoilers={profile.settings.hideSpoilers}
                            onClick={onVideoClick}
                        />
                    ))
                }
            </FocusGroup>
        </div>
    );
};

export default Item;
