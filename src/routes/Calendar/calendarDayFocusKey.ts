// Focus key of a day's first episode in the calendar list.
const pad = (value: number) => String(value).padStart(2, '0');

const calendarDayFocusKey = ({ year, month, day }: CalendarDate) => `calendar-day-${year}-${pad(month)}-${pad(day)}`;

export default calendarDayFocusKey;
