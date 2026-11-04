import {
    Children,
    Fragment,
    useCallback,
    useMemo,
} from 'react';
import {
    RiFlag2Fill,
    RiTimeLine,
} from 'react-icons/ri';
import {
    _cs,
    decodeDate,
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import DisplayPicture from '#components/DisplayPicture';
import RawButton from '#components/RawButton';
import { visuallyHiddenClassName } from '#components/VisuallyHidden';
import {
    type JournalLeaveTypeEnum,
    type JournalWorkFromHomeTypeEnum,
} from '#generated/types/graphql';
import useKeybind from '#hooks/useKeybind';
import {
    addDays,
    formatHours,
    NON_WORKING_DAY_LABEL,
} from '#utils/common';
import {
    type DayBoundary,
    formatWeekday,
    getDayTracks,
} from '#utils/dateGroup';

import {
    FULL_OCCUPANCY,
    getOccupancyStep,
    LOW_OCCUPANCY_LIMIT,
    MID_OCCUPANCY_LIMIT,
} from './utils';

import styles from './styles.module.css';

export interface OccupancyDay {
    date: string;
    hours?: number | null;
    leave?: JournalLeaveTypeEnum | null;
    leaveDisplay?: string | null;
    workFromHome?: JournalWorkFromHomeTypeEnum | null;
    occupancy?: number | null;
    entries?: number;
    expectedHours?: number;
    // Days from the date to its first entry, when that came late
    lateByDays?: number | null;
    // Before the logging deadline
    isPending?: boolean;
    loggedDuringStandup?: boolean;
}

// In legend order
const occupancySteps = [
    { className: styles.low, label: `Under ${LOW_OCCUPANCY_LIMIT}%` },
    { className: styles.mid, label: `${LOW_OCCUPANCY_LIMIT}–${MID_OCCUPANCY_LIMIT - 1}%` },
    { className: styles.high, label: `${MID_OCCUPANCY_LIMIT}–${FULL_OCCUPANCY}%` },
    { className: styles.over, label: `Over ${FULL_OCCUPANCY}%` },
];

const MISSING_MARK = 'X';
const MISSING_LABEL = 'No hours';
const MISSING_LEGEND_LABEL = 'Missing';
const LEAVE_LABEL = 'Leave';
const LATE_LABEL = 'Logged late';
const PENDING_LABEL = 'Not due yet';
const PENDING_DESCRIPTION = 'Not due yet, before the logging deadline';
// Matches WORKING_HOURS_PER_DAY in the backend occupancy
const WORKING_HOURS_PER_DAY = 7;
const fullDateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
});

// The side of the cell that the leave takes
const halfLeaveClassNames: Partial<Record<JournalLeaveTypeEnum, string>> = {
    FIRST_HALF: styles.firstHalfLeave,
    SECOND_HALF: styles.secondHalfLeave,
};

// In legend order
const workFromHomeLabels: Record<JournalWorkFromHomeTypeEnum, string> = {
    FIRST_HALF: 'First half WFH',
    FULL: 'WFH',
    SECOND_HALF: 'Second half WFH',
};

// Whether the first and the second half of the day were worked from home
const workFromHomeHalves: Record<JournalWorkFromHomeTypeEnum, [boolean, boolean]> = {
    FIRST_HALF: [true, false],
    FULL: [true, true],
    SECOND_HALF: [false, true],
};

function WorkFromHomeMarks(props: { workFromHome: JournalWorkFromHomeTypeEnum }) {
    const { workFromHome } = props;
    const [firstHalf, secondHalf] = workFromHomeHalves[workFromHome];
    return (
        <span
            className={styles.workFromHomeMarks}
            aria-hidden
        >
            <span className={firstHalf ? styles.homeMark : styles.officeMark} />
            <span className={secondHalf ? styles.homeMark : styles.officeMark} />
        </span>
    );
}

const shortDateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

function getLateText(date: string, lateByDays: number) {
    return `Logged late, first entry on ${shortDateFormatter.format(decodeDate(addDays(date, lateByDays)))}`;
}

// A corner tick, read out after the cell's own text
function LateMark(props: { date: string, lateByDays: number | null | undefined }) {
    const { date, lateByDays } = props;
    if (isNotDefined(lateByDays)) {
        return null;
    }
    return (
        <>
            <span
                className={styles.lateMark}
                aria-hidden
            />
            <span className={visuallyHiddenClassName}>
                {`, ${getLateText(date, lateByDays).toLowerCase()}`}
            </span>
        </>
    );
}

function BoundarySpacer(props: { boundary: DayBoundary | undefined }) {
    const { boundary } = props;
    if (!boundary) {
        return null;
    }
    return (
        <td
            className={boundary === 'month' ? styles.monthSpacer : undefined}
            aria-hidden
        />
    );
}

function getOccupancyClassName(percent: number, isNonWorking: boolean | undefined) {
    const step = getOccupancyStep(percent);
    // Any hours on a non-working day are extra
    if (isNonWorking && step !== 'over') {
        return styles.high;
    }
    return styles[step];
}

function getCellTitle(displayName: string, day: OccupancyDay) {
    const parts = [
        displayName,
        fullDateFormatter.format(decodeDate(day.date)),
        day.leaveDisplay && `${day.leaveDisplay} leave`,
        day.workFromHome && workFromHomeLabels[day.workFromHome],
        isNotDefined(day.hours) ? MISSING_LABEL : `${day.hours}h`,
        day.entries ? `${day.entries} ${day.entries === 1 ? 'entry' : 'entries'}` : undefined,
        isNotDefined(day.occupancy) ? undefined : `${Math.round(day.occupancy * 100)}%`,
        isDefined(day.lateByDays) && !day.loggedDuringStandup
            ? getLateText(day.date, day.lateByDays)
            : undefined,
        day.loggedDuringStandup ? `${LATE_LABEL}, during standup` : undefined,
    ];
    return parts.filter(Boolean).join(' · ');
}

interface CellProps {
    displayName: string;
    day: OccupancyDay;
    isNonWorking?: boolean;
    // Not missing yet while it has no entries
    isPending?: boolean;
    // Opens the day's records elsewhere, in a new tab
    href?: string;
}

// Covers the whole cell, so the cell keeps its own content and title
function CellLink(props: { href: string | undefined, label: string }) {
    const { href, label } = props;
    if (!href) {
        return null;
    }
    return (
        <a
            className={styles.cellLink}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
        >
            <span className={visuallyHiddenClassName}>
                {`${label}, open the day in admin`}
            </span>
        </a>
    );
}

function OccupancyCell(props: CellProps) {
    const {
        displayName,
        day,
        isNonWorking,
        isPending,
        href,
    } = props;

    const title = getCellTitle(displayName, day);

    if (day.leave === 'FULL') {
        // Hours logged on leave, against a full working day
        const occupancy = isDefined(day.hours) ? day.hours / WORKING_HOURS_PER_DAY : undefined;
        const percent = isDefined(occupancy) ? Math.round(occupancy * 100) : undefined;
        const leaveTitle = getCellTitle(displayName, { ...day, occupancy });
        return (
            <td
                className={_cs(styles.cell, styles.leave)}
                title={isDefined(day.hours) ? `${leaveTitle} · Logged on leave` : leaveTitle}
                aria-label={isDefined(day.hours)
                    ? [
                        `${LEAVE_LABEL}, ${percent}%, ${formatHours(day.hours)}`,
                        isDefined(day.lateByDays)
                            && getLateText(day.date, day.lateByDays).toLowerCase(),
                    ].filter(Boolean).join(', ')
                    : LEAVE_LABEL}
            >
                {percent}
                <LateMark
                    date={day.date}
                    lateByDays={day.lateByDays}
                />
                <CellLink
                    href={href}
                    label={leaveTitle}
                />
            </td>
        );
    }

    const workFromHomeMarks = day.workFromHome && (
        <WorkFromHomeMarks workFromHome={day.workFromHome} />
    );

    const halfLeaveClassName = day.leave ? halfLeaveClassNames[day.leave] : undefined;

    if (isNonWorking && isNotDefined(day.occupancy)) {
        return (
            <td
                className={_cs(styles.cell, styles.offDay)}
                title={`${title} · ${NON_WORKING_DAY_LABEL}`}
                aria-label={NON_WORKING_DAY_LABEL}
            />
        );
    }

    // Before the user joined or after an inactive user left
    if (isNotDefined(day.occupancy) && day.expectedHours === 0) {
        return (
            <td
                className={styles.cell}
                title={`${title} · No hours expected`}
                aria-label="No hours expected"
            />
        );
    }

    if (isNotDefined(day.occupancy) && isPending) {
        return (
            <td
                className={_cs(styles.cell, styles.pending)}
                title={`${title} · ${PENDING_DESCRIPTION}`}
                aria-label={PENDING_DESCRIPTION}
            >
                <RiTimeLine
                    className={styles.pendingIcon}
                    aria-hidden
                />
                {workFromHomeMarks}
            </td>
        );
    }

    if (isNotDefined(day.occupancy)) {
        return (
            <td
                className={_cs(styles.cell, styles.missing, halfLeaveClassName)}
                title={title}
                aria-label={MISSING_LABEL}
            >
                <span aria-hidden>
                    {MISSING_MARK}
                </span>
                {workFromHomeMarks}
                <CellLink
                    href={href}
                    label={title}
                />
            </td>
        );
    }

    const percent = Math.round(day.occupancy * 100);

    return (
        <td
            className={_cs(
                styles.cell,
                halfLeaveClassName,
                getOccupancyClassName(percent, isNonWorking),
            )}
            title={title}
        >
            {percent}
            {workFromHomeMarks}
            <LateMark
                date={day.date}
                lateByDays={day.lateByDays}
            />
            <CellLink
                href={href}
                label={title}
            />
        </td>
    );
}

interface LegendProps {
    className?: string;
    withWorkFromHome?: boolean;
    withEvents?: boolean;
    withNonWorkingDays?: boolean;
    withLateLogging?: boolean;
    withPending?: boolean;
}

export function OccupancyLegend(props: LegendProps) {
    const {
        className,
        withWorkFromHome,
        withEvents,
        withNonWorkingDays,
        withLateLogging,
        withPending,
    } = props;

    return (
        <div className={_cs(styles.legend, className)}>
            <span className={styles.legendTitle}>
                Day cells show occupancy:
            </span>
            {occupancySteps.map((step) => (
                <span
                    key={step.label}
                    className={styles.legendItem}
                >
                    <span
                        className={_cs(styles.swatch, step.className)}
                        aria-hidden
                    />
                    {step.label}
                </span>
            ))}
            <span className={styles.legendItem}>
                <span
                    className={_cs(styles.swatch, styles.missing)}
                    aria-hidden
                >
                    {MISSING_MARK}
                </span>
                {MISSING_LEGEND_LABEL}
            </span>
            {withPending && (
                <span className={styles.legendItem}>
                    <span
                        className={_cs(styles.swatch, styles.pending)}
                        aria-hidden
                    >
                        <RiTimeLine className={styles.pendingIcon} />
                    </span>
                    {PENDING_LABEL}
                </span>
            )}
            <span className={styles.legendItem}>
                <span
                    className={_cs(styles.swatch, styles.leave)}
                    aria-hidden
                />
                {LEAVE_LABEL}
            </span>
            {withWorkFromHome && (
                Object.entries(workFromHomeLabels) as [JournalWorkFromHomeTypeEnum, string][]
            ).map(([workFromHome, workFromHomeLabel]) => (
                <span
                    key={workFromHome}
                    className={styles.legendItem}
                >
                    <WorkFromHomeMarks workFromHome={workFromHome} />
                    {workFromHomeLabel}
                </span>
            ))}
            {withLateLogging && (
                <span className={styles.legendItem}>
                    <span
                        className={styles.swatch}
                        aria-hidden
                    >
                        <span className={styles.lateMark} />
                    </span>
                    {LATE_LABEL}
                </span>
            )}
            {withNonWorkingDays && (
                <span className={styles.legendItem}>
                    <span
                        className={_cs(styles.swatch, styles.offDay)}
                        aria-hidden
                    />
                    {NON_WORKING_DAY_LABEL}
                </span>
            )}
            {withEvents && (
                <span className={styles.legendItem}>
                    <RiFlag2Fill className={styles.eventMarker} />
                    Event
                </span>
            )}
        </div>
    );
}

interface OccupancyRow {
    key: string;
    displayName: string;
    displayPicture: string | null | undefined;
    days: OccupancyDay[];
    labelSuffix?: React.ReactNode;
    trailingCells?: React.ReactNode;
}

interface Props {
    className?: string;
    label: string;
    dates: string[];
    rows: OccupancyRow[];
    userHeading?: React.ReactNode;
    userHeadingSort?: 'ascending' | 'descending';
    labelSuffixHeading?: React.ReactNode;
    trailingHeadings?: React.ReactNode;
    // Event names by date
    dateMarkers?: Record<string, string>;
    loading?: boolean;
    // Renders a day as a td
    cellComponent?: React.ComponentType<CellProps>;
    nonWorkingDates?: Set<string>;
    // Month and week headings as filled bands with centred labels
    withGroupBands?: boolean;
    // Only the dates head the days, for a range that is one month anyway
    withoutGroupHeadings?: boolean;
    // A link for a day of a row, shown on the cells with hours, leave or missing hours
    getDayHref?: (rowKey: string, date: string) => string | undefined;
    // Clicking a name selects its row, and the other body rows dim
    selectedRowKey?: string;
    onSelectedRowKeyChange?: (key: string | undefined) => void;
}

function OccupancyHeatmap(props: Props) {
    const {
        className,
        label,
        dates,
        rows,
        userHeading = 'Team member',
        userHeadingSort,
        labelSuffixHeading,
        trailingHeadings,
        dateMarkers,
        loading,
        cellComponent: Cell = OccupancyCell,
        nonWorkingDates,
        withGroupBands,
        withoutGroupHeadings,
        getDayHref,
        selectedRowKey,
        onSelectedRowKeyChange,
    } = props;

    const {
        months,
        weeks,
        boundaries,
        tracks,
    } = useMemo(
        () => getDayTracks(dates),
        [dates],
    );

    const hasSelectedRow = rows.some((row) => row.key === selectedRowKey);

    const handleUserClick = useCallback(
        (key: string) => {
            onSelectedRowKeyChange?.(key === selectedRowKey ? undefined : key);
        },
        [selectedRowKey, onSelectedRowKeyChange],
    );

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isDefined(selectedRowKey)) {
                onSelectedRowKeyChange?.(undefined);
            }
        },
        [selectedRowKey, onSelectedRowKeyChange],
    );

    useKeybind(handleKeyDown);

    const gridTemplateColumns = [
        'max-content',
        ...tracks,
        ...Array<string>(Children.count(trailingHeadings)).fill('max-content'),
    ].join(' ');

    const userHeadingCell = (
        <th
            className={styles.user}
            rowSpan={withoutGroupHeadings ? undefined : 3}
            aria-sort={userHeadingSort}
        >
            <div className={styles.userContent}>
                <span className={styles.userHeading}>
                    {userHeading}
                </span>
                {labelSuffixHeading}
            </div>
        </th>
    );
    const dateHeadingCells = dates.map((value) => {
        const dateValue = decodeDate(value);
        const marker = dateMarkers?.[value];
        const isNonWorking = nonWorkingDates?.has(value);
        return (
            <Fragment key={value}>
                <BoundarySpacer boundary={boundaries[value]} />
                <th
                    className={_cs(
                        styles.dateHeading,
                        isNonWorking && styles.nonWorking,
                        marker && styles.eventDay,
                    )}
                >
                    <span className={styles.weekday}>
                        {formatWeekday(dateValue)}
                    </span>
                    <span>
                        {dateValue.getDate()}
                    </span>
                    {isNonWorking && (
                        <span className={visuallyHiddenClassName}>
                            {NON_WORKING_DAY_LABEL}
                        </span>
                    )}
                    {marker && (
                        <RiFlag2Fill
                            className={styles.eventMarker}
                            role="img"
                            aria-label={marker}
                            title={marker}
                        />
                    )}
                </th>
            </Fragment>
        );
    });

    return (
        <div
            className={_cs(
                styles.occupancyHeatmap,
                loading && styles.loading,
                withGroupBands && styles.withGroupBands,
                withoutGroupHeadings && styles.withoutGroupHeadings,
                className,
            )}
        >
            <table
                className={styles.table}
                style={{ gridTemplateColumns }}
                aria-label={label}
            >
                <thead>
                    {withoutGroupHeadings ? (
                        <tr>
                            {userHeadingCell}
                            {dateHeadingCells}
                            {trailingHeadings}
                        </tr>
                    ) : (
                        <>
                            <tr>
                                {userHeadingCell}
                                {months.map((month) => (
                                    <Fragment key={month.key}>
                                        <BoundarySpacer boundary={boundaries[month.firstDate]} />
                                        <th
                                            className={styles.groupHeading}
                                            colSpan={month.trackSpan}
                                            style={{ gridColumn: `span ${month.trackSpan}` }}
                                        >
                                            <span className={styles.groupLabel}>
                                                {month.label}
                                            </span>
                                        </th>
                                    </Fragment>
                                ))}
                                {trailingHeadings}
                            </tr>
                            <tr>
                                {weeks.map((week) => (
                                    <Fragment key={week.key}>
                                        <BoundarySpacer boundary={boundaries[week.firstDate]} />
                                        <th
                                            className={_cs(styles.groupHeading, styles.weekHeading)}
                                            colSpan={week.trackSpan}
                                            style={{ gridColumn: `span ${week.trackSpan}` }}
                                        >
                                            <span className={styles.groupLabel}>
                                                {week.label}
                                            </span>
                                        </th>
                                    </Fragment>
                                ))}
                            </tr>
                            <tr>
                                {dateHeadingCells}
                            </tr>
                        </>
                    )}
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const userLabel = (
                            <>
                                <DisplayPicture
                                    className={styles.displayPicture}
                                    imageUrl={row.displayPicture}
                                    displayName={row.displayName}
                                />
                                <span
                                    className={styles.displayName}
                                    title={row.displayName}
                                >
                                    {row.displayName}
                                </span>
                            </>
                        );
                        return (
                            <tr
                                key={row.key}
                                className={hasSelectedRow && row.key !== selectedRowKey
                                    ? styles.dimmed
                                    : undefined}
                            >
                                <th className={styles.user}>
                                    <div className={styles.userContent}>
                                        {onSelectedRowKeyChange ? (
                                            <RawButton
                                                className={styles.userButton}
                                                name={row.key}
                                                onClick={handleUserClick}
                                                title="Show this person's month"
                                                aria-pressed={row.key === selectedRowKey}
                                            >
                                                {userLabel}
                                            </RawButton>
                                        ) : userLabel}
                                        {row.labelSuffix}
                                    </div>
                                </th>
                                {row.days.map((day) => (
                                    <Fragment key={day.date}>
                                        <BoundarySpacer boundary={boundaries[day.date]} />
                                        <Cell
                                            displayName={row.displayName}
                                            day={day}
                                            isNonWorking={nonWorkingDates?.has(day.date)}
                                            isPending={day.isPending}
                                            href={getDayHref?.(row.key, day.date)}
                                        />
                                    </Fragment>
                                ))}
                                {row.trailingCells}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default OccupancyHeatmap;
