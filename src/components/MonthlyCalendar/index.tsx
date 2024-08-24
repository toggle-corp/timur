import { useMemo } from 'react';
import {
    _cs,
    encodeDate,
} from '@togglecorp/fujs';

import RawButton from '#components/RawButton';

import styles from './styles.module.css';

const weekDaysName = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
];

interface Day {
    date: number;
    dayOfWeek: number;
    week: number;
}

interface Props {
    year: number;
    month: number;
    className?: string;
    onDateClick?: (date: string) => void;
    weekDayNameClassName?: string;
    dateClassName?: string;
}

function MonthlyCalendar(props: Props) {
    const {
        year,
        month,
        className,
        onDateClick,
        weekDayNameClassName,
        dateClassName,
    } = props;

    const daysInMonth = useMemo(() => {
        // NOTE: getDate() starts at 1
        // where as getDay() starts at 0
        const startDate = new Date(year, month, 1);
        const startDateOffset = startDate.getDay();
        const days: Day[] = [];

        while (startDate.getMonth() === month) {
            const date = startDate.getDate();
            days.push({
                date,
                dayOfWeek: startDate.getDay(),
                week: Math.floor((startDateOffset + (date - 1)) / 7),
            });

            startDate.setDate(startDate.getDate() + 1);
        }

        return days;
    }, [year, month]);

    return (
        <div className={_cs(styles.monthlyCalendar, className)}>
            {weekDaysName.map((dayName, i) => (
                <div
                    className={_cs(styles.dayName, weekDayNameClassName)}
                    key={dayName}
                    style={{
                        gridColumnStart: i + 1,
                        gridRowStart: 1,
                    }}
                >
                    {dayName}
                </div>
            ))}
            {daysInMonth.map((day) => {
                const date = encodeDate(new Date(year, month, day.date));
                return (
                    <RawButton
                        onClick={onDateClick}
                        className={_cs(styles.date, dateClassName)}
                        name={date}
                        title={`Set date to ${date}`}
                        key={day.date}
                        style={{
                            gridColumnStart: day.dayOfWeek + 1,
                            // Note +2 is due to the week day name row
                            gridRowStart: day.week + 2,
                        }}
                    >
                        {day.date}
                    </RawButton>
                );
            })}
        </div>
    );
}

export default MonthlyCalendar;
