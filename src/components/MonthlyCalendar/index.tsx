import {
    useCallback,
    useMemo,
    useState,
} from 'react';
import {
    IoChevronBackSharp,
    IoChevronForwardSharp,
} from 'react-icons/io5';
import {
    _cs,
    encodeDate,
} from '@togglecorp/fujs';

import Button from '#components/Button';

import styles from './styles.module.css';

const weekDaysName = [
    'Su',
    'Mo',
    'Tu',
    'We',
    'Th',
    'Fr',
    'Sa',
];

interface Day {
    date: number;
    dayOfWeek: number;
    week: number;
}

interface Props {
    selectedDate: string;
    year: number;
    month: number;
    className?: string;
    onDateClick?: (date: string) => void;
    weekDayNameClassName?: string;
    dateClassName?: string;
}

function MonthlyCalendar(props: Props) {
    const {
        year: initialYear,
        month: initialMonth,
        className,
        onDateClick,
        weekDayNameClassName,
        dateClassName,
        selectedDate,
    } = props;

    const [year, setYear] = useState(initialYear);
    const [month, setMonth] = useState(initialMonth);

    const today = new Date();

    const handlePrevMonth = useCallback(
        () => {
            const newMonth = month - 1;
            if (newMonth === -1) {
                setMonth(11);
                setYear(year - 1);
            } else {
                setMonth(newMonth);
            }
        },
        [month, year],
    );
    const handleNextMonth = useCallback(
        () => {
            const newMonth = month + 1;
            if (newMonth === 12) {
                setMonth(0);
                setYear(year + 1);
            } else {
                setMonth(newMonth);
            }
        },
        [month, year],
    );

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
        <div className={_cs(styles.calendarContainer, className)}>
            <div className={styles.header}>
                <div>
                    {year}
                    /
                    {month + 1}
                </div>
                <Button
                    name={undefined}
                    variant="secondary"
                    onClick={handlePrevMonth}
                    title="See previous month"
                    spacing="xs"
                >
                    <IoChevronBackSharp />
                </Button>
                <Button
                    name={undefined}
                    variant="secondary"
                    onClick={handleNextMonth}
                    title="See next month"
                    spacing="xs"
                >
                    <IoChevronForwardSharp />
                </Button>
            </div>
            <div className={styles.monthlyCalendar}>
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
                    let variant;
                    if (encodeDate(today) === date) {
                        variant = 'primary' as const;
                    } else if (selectedDate === date) {
                        variant = 'secondary' as const;
                    } else {
                        variant = 'tertiary' as const;
                    }
                    return (
                        <Button
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
                            variant={variant}
                        >
                            {day.date}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}

export default MonthlyCalendar;
