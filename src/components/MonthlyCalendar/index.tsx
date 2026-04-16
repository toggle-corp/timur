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
import {
    gql,
    useQuery,
} from 'urql';

import AvailabilityIndicator from '#components/AvailabilityIndicator';
import Button from '#components/Button';
import DateContext from '#contexts/date';
import {
    type JournalLeaveTypeEnum,
    type JournalWorkFromHomeTypeEnum,
    type MonthlyCalendarDataQuery,
    type MonthlyCalendarDataQueryVariables,
} from '#generated/types/graphql';
import { addDays } from '#utils/common';

import styles from './styles.module.css';

interface DateInfo {
    totalMinutes?: number;
    targetMinutes?: number;
    isHoliday?: boolean;
    leaveType?: JournalLeaveTypeEnum | null;
    wfhType?: JournalWorkFromHomeTypeEnum | null;
    hasEvent?: boolean;
}

const MONTHLY_CALENDAR_DATA = gql`
    query MonthlyCalendarData($dateGte: Date!, $dateLte: Date!) {
        private {
            id
            hoursPerDay(dateGte: $dateGte, dateLte: $dateLte) {
                date
                totalMinutes
                targetMinutes
                isHoliday
                leaveType
                wfhType
            }
            events(
                filters: {
                    startDate: { lte: $dateLte }
                    endDate: { gte: $dateGte }
                    types: [HOLIDAY, RETREAT, MISC]
                }
            ) {
                items {
                    id
                    startDate
                    endDate
                    dates
                }
            }
            allProjects {
                id
                deadlines {
                    id
                    endDate
                }
            }
        }
    }
`;

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
    onMonthChange?: (year: number, month: number) => void;
    componentRef?: React.MutableRefObject<{
        resetView: (year: number, month: number) => void;
    } | null>;
}

function MonthlyCalendar(props: Props) {
    const {
        initialYear,
        initialMonth,
        componentRef,
        className,
        onDateClick,
        onMonthChange,
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

    useEffect(() => {
        onMonthChange?.(year, month);
    }, [onMonthChange, year, month]);

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

    const monthStart = useMemo(
        () => encodeDate(new Date(year, month, 1)),
        [year, month],
    );

    const monthEnd = useMemo(
        () => encodeDate(new Date(year, month + 1, 0)),
        [year, month],
    );

    const [calendarDataResult] = useQuery<
        MonthlyCalendarDataQuery,
        MonthlyCalendarDataQueryVariables
    >({
        query: MONTHLY_CALENDAR_DATA,
        variables: { dateGte: monthStart, dateLte: monthEnd },
        requestPolicy: 'cache-and-network',
    });

    const dateInfoMap = useMemo(() => {
        const map = new Map<string, DateInfo>();

        calendarDataResult.data?.private.hoursPerDay.forEach((entry) => {
            const dateStr = String(entry.date);
            map.set(dateStr, {
                totalMinutes: entry.totalMinutes,
                targetMinutes: entry.targetMinutes,
                isHoliday: entry.isHoliday,
                leaveType: entry.leaveType,
                wfhType: entry.wfhType,
                hasEvent: false,
            });
        });

        calendarDataResult.data?.private.allProjects.forEach((project) => {
            project.deadlines.forEach((deadline) => {
                const dateStr = String(deadline.endDate);
                const existing = map.get(dateStr) ?? {};
                map.set(dateStr, { ...existing, hasEvent: true });
            });
        });

        calendarDataResult.data?.private.events.items.forEach((event) => {
            if (event.dates.length > 0) {
                event.dates.forEach((d) => {
                    const dateStr = String(d);
                    const existing = map.get(dateStr) ?? {};
                    map.set(dateStr, { ...existing, hasEvent: true });
                });
            } else {
                let cursor = String(event.startDate);
                const end = String(event.endDate);
                while (cursor <= end) {
                    const existing = map.get(cursor) ?? {};
                    map.set(cursor, { ...existing, hasEvent: true });
                    cursor = addDays(cursor, 1);
                }
            }
        });

        return map;
    }, [calendarDataResult.data]);

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
                    variant="tertiary"
                    onClick={handlePrevMonth}
                    title="See previous month in calendar"
                    spacing="xs"
                >
                    <RiArrowLeftSLine />
                </Button>
                <Button
                    name={undefined}
                    variant="tertiary"
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

                    const info = dateInfoMap.get(date);
                    const isPast = date <= fullDate;
                    const targetMinutes = info?.targetMinutes ?? 0;
                    const totalMinutes = info?.totalMinutes ?? 0;
                    const fillPct = isPast && targetMinutes > 0
                        ? Math.min(1, totalMinutes / targetMinutes)
                        : 0;
                    const hue = Math.round(fillPct * 120);
                    const hoursBg = isPast && targetMinutes > 0
                        ? `hsla(${hue}, 55%, 50%, 0.18)`
                        : undefined;

                    const effectiveLeaveType: JournalLeaveTypeEnum | null = info?.isHoliday
                        ? 'FULL'
                        : (info?.leaveType ?? null);
                    const effectiveWfhType = info?.wfhType ?? null;
                    const hasAvailability = effectiveLeaveType != null || effectiveWfhType != null;

                    return (
                        <Button
                            onClick={onDateClick}
                            className={_cs(
                                styles.date,
                                fullDate === date && styles.today,
                                selectedDate === date && styles.selected,
                                dateClassName,
                            )}
                            name={date}
                            title="Set date from calendar"
                            key={day.date}
                            style={{
                                gridColumnStart: day.dayOfWeek + 1,
                                // Note +2 is due to the week day name row
                                gridRowStart: day.week + 2,
                                backgroundColor: hoursBg,
                            }}
                            variant="transparent"
                        >
                            <span className={styles.dateContent}>
                                {day.date}
                                {info?.hasEvent && (
                                    <span className={styles.eventDot} />
                                )}
                                {hasAvailability && (
                                    <AvailabilityIndicator
                                        className={styles.availabilityIndicator}
                                        leaveType={effectiveLeaveType}
                                        wfhType={effectiveWfhType}
                                    />
                                )}
                            </span>
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}

export default MonthlyCalendar;
