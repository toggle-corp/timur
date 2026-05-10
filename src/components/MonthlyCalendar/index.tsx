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

import Button from '#components/Button';
import DateContext from '#contexts/date';
import {
    type JournalLeaveTypeEnum,
    type JournalWorkFromHomeTypeEnum,
    type MonthlyCalendarDataQuery,
    type MonthlyCalendarDataQueryVariables,
} from '#generated/types/graphql';
import useDebouncedValue from '#hooks/useDebouncedValue';
import { addDays } from '#utils/common';

import styles from './styles.module.css';

interface DateInfo {
    totalMinutes?: number;
    targetMinutes?: number;
    isHoliday?: boolean;
    leaveType?: JournalLeaveTypeEnum | null;
    wfhType?: JournalWorkFromHomeTypeEnum | null;
    hasEvent?: boolean;
    eventNames: string[];
    deadlineNames: string[];
}

// FIXME: events are paginated.
// FIXME: allDeadlines should be filtered (also show expired ones).
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
                    name
                    startDate
                    endDate
                    dates
                }
            }
            allDeadlines {
                id
                displayName
                endDate
            }
        }
    }
`;

function leaveTypeLabel(type: JournalLeaveTypeEnum | null | undefined) {
    if (type === 'FULL') {
        return 'Full leave';
    }
    if (type === 'FIRST_HALF') return 'First half leave';
    if (type === 'SECOND_HALF') return 'Second half leave';
    return undefined;
}

function wfhTypeLabel(type: JournalWorkFromHomeTypeEnum | null | undefined) {
    if (type === 'FULL') return 'WFH';
    if (type === 'FIRST_HALF') return 'First half WFH';
    if (type === 'SECOND_HALF') return 'Second half WFH';
    return undefined;
}

function getDatesInRange(startDate: string, endDate: string): string[] {
    const list: string[] = [];
    let cursor = startDate;
    while (cursor <= endDate) {
        list.push(cursor);
        cursor = addDays(cursor, 1);
    }
    return list;
}

const MUTED_COLOR = 'hsla(0, 0%, 50%, 0.12)';

function heatmapAt(pct: number): string {
    return `color-mix(in oklch, color-mix(in oklch, var(--color-secondary) ${Math.round(pct * 100)}%, var(--color-primary)) 50%, var(--color-background))`;
}

function getHeatmapColor(info: DateInfo | undefined): string | undefined {
    const leaveType = info?.leaveType;
    const totalHours = (info?.totalMinutes ?? 0) / 60;

    const fillPct = Math.min(1, totalHours / (
        leaveType === 'FIRST_HALF' || leaveType === 'SECOND_HALF'
            ? 7
            : 3.5
    ));
    const heatmapColor = heatmapAt(fillPct);

    if (leaveType === 'FIRST_HALF') {
        return `radial-gradient(ellipse 70% 70% at 100% 50%, ${heatmapColor} 100%, ${MUTED_COLOR} 100%)`;
    }
    if (leaveType === 'SECOND_HALF') {
        return `radial-gradient(ellipse 70% 70% at 0% 50%, ${heatmapColor} 100%, ${MUTED_COLOR} 100%)`;
    }
    return heatmapColor;
}

function getDateTooltip(dateStr: string, info: DateInfo | undefined): string {
    const lines: string[] = [dateStr];
    if (info?.isHoliday) {
        lines.push('Holiday');
    }
    const leaveLabel = leaveTypeLabel(info?.leaveType);
    if (leaveLabel) {
        lines.push(leaveLabel);
    }
    const wfhLabel = wfhTypeLabel(info?.wfhType);
    if (wfhLabel) {
        lines.push(wfhLabel);
    }
    info?.deadlineNames.forEach((name) => {
        lines.push(`Deadline: ${name}`);
    });
    info?.eventNames.forEach((name) => {
        lines.push(`Event: ${name}`);
    });
    return lines.join('\n');
}

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

interface Props {
    className?: string;
    weekDayNameClassName?: string;
    dateClassName?: string;
    selectedDate: string | undefined;
    initialYear: number;
    initialMonth: number;
    onDateClick?: (date: string) => void;
    onMonthChange?: (year: number, month: number) => void;
    componentRef?: React.RefObject<{
        resetView: (year: number, month: number) => void;
    } | null>;
    lastEditedAt?: number | null;
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
        lastEditedAt,
        selectedDate,
    } = props;

    const [year, setYear] = useState(initialYear);
    const [month, setMonth] = useState(initialMonth);

    const { fullDate } = useContext(DateContext);

    // FIXME: view can be reset internally. not need to expose this to parent
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

    const [calendarDataResult, reexecuteCalendarData] = useQuery<
        MonthlyCalendarDataQuery,
        MonthlyCalendarDataQueryVariables
    >({
        query: MONTHLY_CALENDAR_DATA,
        variables: { dateGte: monthStart, dateLte: monthEnd },
        requestPolicy: 'cache-and-network',
    });

    const debouncedLastEditedAt = useDebouncedValue(lastEditedAt, 2_000);
    useEffect(() => {
        if (!debouncedLastEditedAt) {
            return;
        }
        reexecuteCalendarData({ requestPolicy: 'network-only' });
    }, [debouncedLastEditedAt, reexecuteCalendarData]);

    const dateInfoMap = useMemo(() => {
        const map = new Map<string, DateInfo>();

        const ensure = (dateStr: string): DateInfo => {
            const existing = map.get(dateStr);
            if (existing) {
                return existing;
            }
            const fresh: DateInfo = {
                hasEvent: false,
                eventNames: [],
                deadlineNames: [],
            };
            map.set(dateStr, fresh);
            return fresh;
        };

        calendarDataResult.data?.private.hoursPerDay.forEach((entry) => {
            const info = ensure(String(entry.date));
            info.totalMinutes = entry.totalMinutes;
            info.targetMinutes = entry.targetMinutes;
            info.isHoliday = entry.isHoliday;
            info.leaveType = entry.leaveType;
            info.wfhType = entry.wfhType;
        });

        calendarDataResult.data?.private.allDeadlines.forEach((deadline) => {
            const info = ensure(String(deadline.endDate));
            info.hasEvent = true;
            info.deadlineNames.push(deadline.displayName);
        });

        calendarDataResult.data?.private.events.items.forEach((event) => {
            const eventName = event.name;
            const dates = event.dates.length > 0
                ? event.dates.map(String)
                : getDatesInRange(String(event.startDate), String(event.endDate));
            dates.forEach((dateStr) => {
                const info = ensure(dateStr);
                info.hasEvent = true;
                info.eventNames.push(eventName);
            });
        });

        return map;
    }, [calendarDataResult.data]);

    const daysInMonth = useMemo(() => {
        // getDay() returns 0 for Sun..6 for Sat
        const startDateOffset = new Date(year, month, 1).getDay();
        return getDatesInRange(monthStart, monthEnd).map((_, index) => ({
            date: index + 1,
            dayOfWeek: (startDateOffset + index) % 7,
            week: Math.floor((startDateOffset + index) / 7),
        }));
    }, [year, month, monthStart, monthEnd]);

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

                    const isFuture = date > fullDate;

                    const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;
                    const isOffDay = isWeekend
                        || (info?.isHoliday ?? false)
                        || info?.leaveType === 'FULL';

                    const hasWork = (info?.totalMinutes ?? 0) > 0;
                    let heatmapColor: string | undefined;
                    if (isFuture) {
                        heatmapColor = hasWork ? heatmapAt(1) : undefined;
                    } else if (isOffDay) {
                        heatmapColor = hasWork ? heatmapAt(1) : MUTED_COLOR;
                    } else {
                        heatmapColor = getHeatmapColor(info);
                    }

                    return (
                        <Button
                            onClick={onDateClick}
                            className={_cs(
                                styles.date,
                                fullDate === date && styles.today,
                                selectedDate === date && styles.selected,
                                (info?.hasEvent || info?.isHoliday) && styles.hasMarker,
                                dateClassName,
                            )}
                            name={date}
                            title={getDateTooltip(date, info)}
                            key={day.date}
                            style={{
                                gridColumnStart: day.dayOfWeek + 1,
                                // Note +2 is due to the week day name row
                                gridRowStart: day.week + 2,
                                ['--heatmap-bg-color' as string]: heatmapColor,
                            } as React.CSSProperties}
                            variant="transparent"
                        >
                            <span className={styles.dateContent}>
                                {day.date}
                            </span>
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}

export default MonthlyCalendar;
