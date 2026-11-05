// Copyright (C) 2017-2024 Smart code 203358507

import React, { useState } from 'react';
import { useParams } from 'react-router';
import { useProfile, withCoreSuspender } from 'stremio/common';
import { MainNavBars } from 'stremio/components';
import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { dayFocusKey } from './List/Item/Item';
import Selector from './Selector';
import Table from './Table';
import List from './List';
import Placeholder from './TvPlaceholder';
import useCalendar from './useCalendar';
import styles from './Calendar.less';
import classNames from 'classnames';

// HTPC fork: the logged-out notice's buttons, where the page starts
const NOTICE_FOCUS_KEY = 'calendar:notice';

const Calendar = () => {
    const { year, month } = useParams();
    const urlParams = React.useMemo(() => ({
        year,
        month
    }), [year, month]);
    const calendar = useCalendar(urlParams);
    const profile = useProfile();

    const [selected, setSelected] = useState<CalendarDate | null>(null);
    // HTPC fork: picking a day moves focus to its episodes (nothing happens for a day without any)
    const selectDay = React.useCallback((date: CalendarDate) => {
        setSelected(date);
        if (calendar.items.some((item) => item.date.day === date.day && item.items.length > 0)) {
            setFocus(dayFocusKey(date.day));
        }
    }, [calendar.items]);
    const loading =calendar.metaItems.some(({ type }) => type === 'Loading');

    return (
        <MainNavBars className={styles['calendar']} route={'calendar'} startFocusKey={profile.auth === null ? NOTICE_FOCUS_KEY : undefined}>
            {
                profile.auth !== null ?
                    <div className={classNames(styles['content'], 'animation-fade-in')}>
                        <div className={styles['main']}>
                            <Selector
                                selected={calendar.selected}
                                selectable={calendar.selectable}
                                profile={profile}
                            />
                            <Table
                                items={calendar.items}
                                selected={selected}
                                monthInfo={calendar.monthInfo}
                                onChange={selectDay}
                            />
                        </div>
                        <List
                            items={calendar.items}
                            loading={loading}
                            selected={selected}
                            monthInfo={calendar.monthInfo}
                            profile={profile}
                            onChange={setSelected}
                        />
                    </div>
                    :
                    <Placeholder focusKey={NOTICE_FOCUS_KEY} />
            }
        </MainNavBars>
    );
};

const CalendarFallback = () => (
    <MainNavBars className={styles['calendar']} route={'calendar'} />
);

export default withCoreSuspender(Calendar, CalendarFallback);
