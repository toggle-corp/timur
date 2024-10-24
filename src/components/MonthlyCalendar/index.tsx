import {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    RiArrowLeftSLine,
    RiArrowRightSLine,
} from 'react-icons/ri';
import {
    _cs,
    encodeDate,
} from '@togglecorp/fujs';

import Button from '#components/Button';
import DateContext from '#contexts/date';

import styles from './styles.module.css';

const dateFormatter = new Intl.DateTimeFormat(
    [],
    {
        year: 'numeric',
        month: 'short',
    },
);

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
    className?: string;
    weekDayNameClassName?: string;
    dateClassName?: string;
    selectedDate: string | undefined;
    initialYear: number;
    initialMonth: number;
    onDateClick?: (date: string) => void;
    componentRef?: React.MutableRefObject<{
        resetView: (year: number, month: number) => void;
    } | null>;
}

// TODO: Show holidays, leaves on calendar
function MonthlyCalendar(props: Props) {
    const {
        initialYear,
        initialMonth,
        componentRef,
        className,
        onDateClick,
        weekDayNameClassName,
        dateClassName,
        selectedDate,
    } = props;

    const [year, setYear] = useState(initialYear);
    const [month, setMonth] = useState(initialMonth);

    const { fullDate } = useContext(DateContext);

    const resetView = useCallback(
        (newYear: number, newMonth: number) => {
            setYear(newYear);
            setMonth(newMonth);
        },
        [],
    );

    useEffect(() => {
        if (componentRef) {
            componentRef.current = {
                resetView,
            };
        }
    }, [componentRef, resetView]);

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

    // FIXME: We should be able be use a for loop here
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

    const formattedDate = dateFormatter.format(new Date(year, month, 1));

    return (
        <div className={_cs(styles.calendarContainer, className)}>
            <div className={styles.header}>
                <Button
                    name={undefined}
                    variant="quaternary"
                    onClick={handlePrevMonth}
                    title="See previous month in calendar"
                    spacing="xs"
                >
                    <RiArrowLeftSLine />
                </Button>
                <Button
                    name={undefined}
                    variant="quaternary"
                    onClick={handleNextMonth}
                    title="See next month in calendar"
                    spacing="xs"
                >
                    <RiArrowRightSLine />
                </Button>
                <div className={styles.spacer} />
                <div>
                    {formattedDate}
                </div>
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
                    if (fullDate === date) {
                        variant = 'secondary' as const;
                    } else if (selectedDate === date) {
                        variant = 'quaternary' as const;
                    } else {
                        variant = 'transparent' as const;
                    }
                    return (
                        <Button
                            onClick={onDateClick}
                            className={_cs(styles.date, dateClassName)}
                            name={date}
                            title="Set date from calendar"
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
