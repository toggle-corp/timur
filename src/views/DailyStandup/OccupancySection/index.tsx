import { useMemo } from 'react';
import { FcLandscape } from 'react-icons/fc';
import {
    _cs,
    compareNumber,
    compareString,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import DefaultMessage from '#components/DefaultMessage';
import DisplayPicture from '#components/DisplayPicture';
import SlideCounter from '#components/SlideCounter';
import {
    type DailyStandupOccupancyQuery,
    type DailyStandupOccupancyQueryVariables,
    type JournalLeaveTypeEnum,
} from '#generated/types/graphql';
import useCurrentDate from '#hooks/useCurrentDate';
import { formatDateTime } from '#utils/common';

import Slide from '../Slide';

import styles from './styles.module.css';

type OccupancyDay = NonNullable<
    DailyStandupOccupancyQuery['private']['dailyStandup']['occupancy']
>['users'][number]['days'][number];

const DAILY_STANDUP_OCCUPANCY_QUERY = gql`
    query DailyStandupOccupancy($date: Date!) {
        private {
            id
            dailyStandup(date: $date) {
                id
                occupancy {
                    id
                    startDate
                    endDate
                    dates
                    users {
                        id
                        user {
                            id
                            displayName
                            displayPicture
                        }
                        days {
                            date
                            hours
                            leave
                            occupancy
                        }
                    }
                }
            }
        }
    }
`;

// NOTE: Parsing manually to avoid the UTC shift of new Date('YYYY-MM-DD')
function parseDate(value: string) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'short' });
const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' });
const fullDateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
});

function formatRange(startDate: string, endDate: string) {
    const formatter = new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
    });
    return `${formatter.format(parseDate(startDate))} – ${formatter.format(parseDate(endDate))}`;
}

// ISO 8601 week number
function getWeekNumber(date: Date) {
    const value = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const weekday = value.getUTCDay() || 7;
    // Thursday decides which year the week belongs to
    value.setUTCDate(value.getUTCDate() + 4 - weekday);
    const yearStart = Date.UTC(value.getUTCFullYear(), 0, 1);
    return Math.ceil(((value.getTime() - yearStart) / 86400000 + 1) / 7);
}

interface DateGroup {
    key: string;
    label: string;
    firstDate: string;
    span: number;
}

function groupDates(
    dates: string[],
    getKey: (date: Date, value: string) => string,
    getLabel: (date: Date) => string,
) {
    return dates.reduce<DateGroup[]>(
        (acc, value) => {
            const dateValue = parseDate(value);
            const key = getKey(dateValue, value);
            const last = acc[acc.length - 1];
            if (last && last.key === key) {
                last.span += 1;
            } else {
                acc.push({
                    key,
                    label: getLabel(dateValue),
                    firstDate: value,
                    span: 1,
                });
            }
            return acc;
        },
        [],
    );
}

// Missing counts for these many most recent working days are shown as a warning
const RECENT_DAYS_COUNT = 2;

type Boundary = 'month' | 'week' | undefined;

function getBoundaryClassName(boundary: Boundary) {
    if (boundary === 'month') {
        return _cs(styles.weekStart, styles.monthStart);
    }
    if (boundary === 'week') {
        return styles.weekStart;
    }
    return undefined;
}

function isMissing(day: OccupancyDay) {
    return isNotDefined(day.occupancy);
}

function getLeaveLabel(leave: JournalLeaveTypeEnum | null | undefined) {
    if (leave === 'FULL') {
        return 'Leave';
    }
    if (leave === 'FIRST_HALF') {
        return 'Leave (first half)';
    }
    if (leave === 'SECOND_HALF') {
        return 'Leave (second half)';
    }
    return undefined;
}

function getCellTitle(displayName: string, day: OccupancyDay) {
    const parts = [
        displayName,
        fullDateFormatter.format(parseDate(day.date)),
        getLeaveLabel(day.leave),
        isNotDefined(day.hours) ? 'No entries' : `${day.hours}h`,
        isNotDefined(day.occupancy) ? undefined : `${Math.round(day.occupancy * 100)}%`,
    ];
    return parts.filter(Boolean).join(' · ');
}

interface CellProps {
    displayName: string;
    day: OccupancyDay;
    boundary: Boundary;
}

function OccupancyCell(props: CellProps) {
    const {
        displayName,
        day,
        boundary,
    } = props;

    const title = getCellTitle(displayName, day);
    const boundaryClassName = getBoundaryClassName(boundary);

    if (day.leave === 'FULL') {
        return (
            <td
                className={_cs(styles.cell, boundaryClassName, styles.leave)}
                title={title}
            >
                <FcLandscape />
            </td>
        );
    }

    if (isNotDefined(day.occupancy)) {
        return (
            <td
                className={_cs(styles.cell, boundaryClassName, styles.missing)}
                title={title}
            >
                ?
            </td>
        );
    }

    const percent = Math.round(day.occupancy * 100);

    return (
        <td
            className={_cs(
                styles.cell,
                boundaryClassName,
                day.leave && styles.halfLeave,
                day.occupancy < 0.5 ? styles.low : styles.high,
            )}
            title={title}
            style={{
                ['--occupancy-strength' as string]: `${Math.min(day.occupancy, 1) * 100}%`,
            }}
        >
            {percent}
        </td>
    );
}

interface Props {
    date: string;
    currentSlide: number | undefined;
    totalSlides: number | undefined;
}

function OccupancySection(props: Props) {
    const {
        date,
        currentSlide,
        totalSlides,
    } = props;

    const [occupancyResponse] = useQuery<
        DailyStandupOccupancyQuery,
        DailyStandupOccupancyQueryVariables
    >({
        query: DAILY_STANDUP_OCCUPANCY_QUERY,
        variables: { date },
        requestPolicy: 'cache-and-network',
    });

    const todayDate = useCurrentDate();

    const occupancy = occupancyResponse.data?.private.dailyStandup.occupancy;

    const months = useMemo(
        () => groupDates(
            occupancy?.dates ?? [],
            (_, value) => value.substring(0, 7),
            (dateValue) => monthFormatter.format(dateValue),
        ),
        [occupancy?.dates],
    );

    const weeks = useMemo(
        () => groupDates(
            occupancy?.dates ?? [],
            (dateValue) => `${dateValue.getFullYear()}-${getWeekNumber(dateValue)}`,
            (dateValue) => `W${getWeekNumber(dateValue)}`,
        ),
        [occupancy?.dates],
    );

    // Dates where a new month or week starts, excluding the first column
    const boundaries = useMemo(
        () => {
            const value: Record<string, Boundary> = {};
            weeks.slice(1).forEach((week) => {
                value[week.firstDate] = 'week';
            });
            months.slice(1).forEach((month) => {
                value[month.firstDate] = 'month';
            });
            return value;
        },
        [months, weeks],
    );

    const recentDates = useMemo(
        () => new Set((occupancy?.dates ?? []).slice(-RECENT_DAYS_COUNT)),
        [occupancy?.dates],
    );

    const sortedUsers = useMemo(
        () => (occupancy?.users ?? [])
            .map((item) => {
                const missingDays = item.days.filter(isMissing);
                const hasOlderMissing = missingDays.some((day) => !recentDates.has(day.date));
                let missingSeverity = 2;
                if (hasOlderMissing) {
                    missingSeverity = 0;
                } else if (missingDays.length > 0) {
                    missingSeverity = 1;
                }
                return {
                    ...item,
                    displayName: item.user.displayName ?? `User#${item.user.id}`,
                    missingCount: missingDays.length,
                    // 0: older days missing, 1: only recent days missing, 2: nothing missing
                    missingSeverity,
                    firstMissingDate: missingDays[0]?.date,
                };
            })
            .sort((foo, bar) => (
                compareNumber(foo.missingSeverity, bar.missingSeverity)
                || compareNumber(foo.missingCount, bar.missingCount, -1)
                || compareString(foo.firstMissingDate, bar.firstMissingDate)
                || compareString(foo.displayName, bar.displayName)
            )),
        [occupancy?.users, recentDates],
    );

    const usersWithMissing = sortedUsers.filter((item) => item.missingSeverity === 0).length;
    const usersWithRecentMissing = sortedUsers
        .filter((item) => item.missingSeverity === 1).length;
    const isEmpty = sortedUsers.length === 0 || (occupancy?.dates.length ?? 0) === 0;

    return (
        <Slide
            className={styles.occupancySection}
            variant="general"
        >
            <div className={styles.content}>
                <header className={styles.header}>
                    <div className={styles.headingSection}>
                        <h2 className={styles.heading}>
                            Is your Timur up to date?
                        </h2>
                        {occupancy && (
                            <div className={styles.range}>
                                {formatRange(occupancy.startDate, occupancy.endDate)}
                            </div>
                        )}
                    </div>
                    <div className={styles.summary}>
                        {!isEmpty && usersWithMissing > 0 && (
                            <span className={styles.missingSummary}>
                                {usersWithMissing === 1
                                    ? '1 person has days without entries or leave'
                                    : `${usersWithMissing} people have days without entries or leave`}
                            </span>
                        )}
                        {!isEmpty && usersWithRecentMissing > 0 && (
                            <span className={styles.recentMissingSummary}>
                                {usersWithRecentMissing === 1
                                    ? '1 more person is only missing the last couple of days'
                                    : `${usersWithRecentMissing} more people are only missing the last couple of days`}
                            </span>
                        )}
                        {!isEmpty && usersWithMissing + usersWithRecentMissing === 0 && (
                            <span>Everyone is up to date!</span>
                        )}
                        <div className={styles.legend}>
                            <span className={styles.legendItem}>
                                <span className={_cs(styles.swatch, styles.missing)}>?</span>
                                No entries
                            </span>
                            <span className={styles.legendItem}>
                                <span className={_cs(styles.swatch, styles.leave)}>
                                    <FcLandscape />
                                </span>
                                Leave
                            </span>
                            <span className={styles.legendItem}>
                                <span className={_cs(styles.swatch, styles.halfLeave)} />
                                Half leave
                            </span>
                            <span className={styles.legendItem}>
                                % of 7h
                            </span>
                        </div>
                    </div>
                </header>
                {!isEmpty && (
                    <div
                        className={_cs(
                            styles.tableContainer,
                            occupancyResponse.fetching && styles.loading,
                        )}
                    >
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th
                                        className={styles.user}
                                        rowSpan={3}
                                    >
                                        <div className={styles.userContent}>
                                            <span className={styles.userHeading}>
                                                Team member
                                            </span>
                                            <span className={styles.missingHeading}>
                                                Missing
                                            </span>
                                        </div>
                                    </th>
                                    {months.map((month) => (
                                        <th
                                            key={month.key}
                                            className={_cs(
                                                styles.groupHeading,
                                                getBoundaryClassName(boundaries[month.firstDate]),
                                            )}
                                            colSpan={month.span}
                                        >
                                            {month.label}
                                        </th>
                                    ))}
                                </tr>
                                <tr>
                                    {weeks.map((week) => (
                                        <th
                                            key={week.key}
                                            className={_cs(
                                                styles.groupHeading,
                                                styles.weekHeading,
                                                getBoundaryClassName(boundaries[week.firstDate]),
                                            )}
                                            colSpan={week.span}
                                        >
                                            {week.label}
                                        </th>
                                    ))}
                                </tr>
                                <tr>
                                    {occupancy?.dates.map((value) => {
                                        const dateValue = parseDate(value);
                                        return (
                                            <th
                                                key={value}
                                                className={_cs(
                                                    styles.dateHeading,
                                                    getBoundaryClassName(boundaries[value]),
                                                )}
                                            >
                                                <span className={styles.weekday}>
                                                    {weekdayFormatter.format(dateValue)}
                                                </span>
                                                <span>
                                                    {dateValue.getDate()}
                                                </span>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedUsers.map((item) => (
                                    <tr key={item.id}>
                                        <th className={styles.user}>
                                            <div className={styles.userContent}>
                                                <DisplayPicture
                                                    className={styles.displayPicture}
                                                    imageUrl={item.user.displayPicture}
                                                    displayName={item.displayName}
                                                />
                                                <span
                                                    className={styles.displayName}
                                                    title={item.displayName}
                                                >
                                                    {item.displayName}
                                                </span>
                                                <span
                                                    className={_cs(
                                                        styles.missingCount,
                                                        item.missingSeverity === 0
                                                            && styles.hasMissing,
                                                        item.missingSeverity === 1
                                                            && styles.hasRecentMissing,
                                                    )}
                                                >
                                                    {item.missingCount > 0 ? item.missingCount : '✓'}
                                                </span>
                                            </div>
                                        </th>
                                        {item.days.map((day) => (
                                            <OccupancyCell
                                                key={day.date}
                                                displayName={item.displayName}
                                                day={day}
                                                boundary={boundaries[day.date]}
                                            />
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <DefaultMessage
                    compact
                    filtered={false}
                    empty={isEmpty}
                    pending={isEmpty && occupancyResponse.fetching}
                    errored={!!occupancyResponse.error}
                    pendingMessage="Crunching the numbers"
                    errorMessage="Something went sideways!"
                    emptyMessage="No working days to show yet!"
                />
                <footer className={styles.footer}>
                    <span>{formatDateTime(todayDate)}</span>
                    <SlideCounter
                        current={currentSlide}
                        total={totalSlides}
                    />
                </footer>
            </div>
        </Slide>
    );
}

export default OccupancySection;
