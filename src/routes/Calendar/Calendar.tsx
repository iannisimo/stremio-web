// Copyright (C) 2017-2024 Smart code 203358507

import React, { useCallback, useState } from 'react';
import { doesFocusableExist } from '@noriginmedia/norigin-spatial-navigation';
import { setFocus } from 'stremio/services/Navigation';
import calendarDayFocusKey from './calendarDayFocusKey';
import { useParams } from 'react-router';
import { useProfile, withCoreSuspender } from 'stremio/common';
import { MainNavBars } from 'stremio/components';
import Selector from './Selector';
import Table from './Table';
import List from './List';
import Placeholder from './TvPlaceholder';
import useCalendar from './useCalendar';
import styles from './Calendar.less';
import classNames from 'classnames';

const Calendar = () => {
    const { year, month } = useParams();
    const urlParams = React.useMemo(() => ({
        year,
        month
    }), [year, month]);
    const calendar = useCalendar(urlParams);
    const profile = useProfile();

    const [selected, setSelected] = useState<CalendarDate | null>(null);
    const loading = calendar.metaItems.some(({ type }) => type === 'Loading');

    // HTPC fork: the posters inside a day aren't reachable, so Enter on a day
    // moves to its first episode in the list
    const onDaySelect = useCallback((date: CalendarDate) => {
        setSelected(date);
        const key = calendarDayFocusKey(date);
        if (doesFocusableExist(key)) setFocus(key);
    }, []);

    return (
        <MainNavBars className={styles['calendar']} route={'calendar'}>
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
                                onChange={onDaySelect}
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
                    <Placeholder />
            }
        </MainNavBars>
    );
};

const CalendarFallback = () => (
    <MainNavBars className={styles['calendar']} />
);

export default withCoreSuspender(Calendar, CalendarFallback);
