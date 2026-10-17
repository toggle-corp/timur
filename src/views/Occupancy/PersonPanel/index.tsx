import {
    useCallback,
    useEffect,
    useId,
    useRef,
} from 'react';
import { RiCloseLine } from 'react-icons/ri';
import {
    _cs,
    decodeDate,
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import AdminEditLink from '#components/AdminEditLink';
import AdminLink from '#components/AdminLink';
import Button from '#components/Button';
import DisplayPicture from '#components/DisplayPicture';
import { type OccupancyDay } from '#components/OccupancyHeatmap';
import {
    type OccupancyPersonQuery,
    type OccupancyPersonQueryVariables,
} from '#generated/types/graphql';
import useKeybind from '#hooks/useKeybind';
import { getAdminDayUrl } from '#utils/admin';
import {
    addDays,
    formatHours,
    formatShare,
} from '#utils/common';

import {
    LONG_ENTRY_HOURS,
    TREND_START_DATE,
    VAGUE_DESCRIPTION,
} from '../utils';

import styles from './styles.module.css';

const OCCUPANCY_PERSON_QUERY = gql`
    query OccupancyPerson($userId: ID!, $endDate: Date!) {
        private {
            id
            occupancyPerson(userId: $userId, endDate: $endDate) {
                id
                months {
                    startDate
                    occupancy
                    lateShare
                    leaveDays
                    workFromHomeDays
                }
                leaveDaysThisYear
            }
        }
    }
`;

// Matches LONG_DAY_HOURS in the backend occupancy
const LONG_DAY_HOURS = 9;
// Projects listed by name; the rest add up to one line
const TOP_PROJECTS = 5;
// Bars above this are drawn at the top, so that one long month keeps the others readable
const MAX_TREND_OCCUPANCY = 1.5;

const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'short' });
const countFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

const halfLabels: Record<string, string> = {
    FIRST_HALF: 'first half',
    SECOND_HALF: 'second half',
};

function formatDate(date: string) {
    return dateFormatter.format(decodeDate(date));
}

function formatDays(count: number) {
    return `${countFormatter.format(count)} ${count === 1 ? 'day' : 'days'}`;
}

// Without the sign, so that a year of labels fits; the heading carries the unit
function formatPercentNumber(value: number | null | undefined) {
    return isDefined(value) ? countFormatter.format(Math.round(value * 100)) : 'n/a';
}

function formatDayCount(value: number | null | undefined) {
    return countFormatter.format(value ?? 0);
}

function formatPercent(value: number | null | undefined) {
    return isDefined(value) ? formatShare(value) : 'n/a';
}

interface DateItem {
    date: string;
    label: string;
    // The day's records in the admin
    href: string;
}

function DateList(props: { items: DateItem[], emptyMessage: string }) {
    const { items, emptyMessage } = props;
    if (items.length === 0) {
        return <p className={styles.none}>{emptyMessage}</p>;
    }
    return (
        <ul className={styles.dates}>
            {items.map((item) => (
                <li key={item.date}>
                    <AdminLink
                        href={item.href}
                        title="Open the day in admin"
                    >
                        {item.label}
                    </AdminLink>
                </li>
            ))}
        </ul>
    );
}

interface FlaggedEntry {
    id: string;
    date: string;
    hours: number;
    description: string;
    project: { id: string, name: string };
    taskName: string;
    isLong: boolean;
    isVague: boolean;
}

function EntryList(props: { entries: FlaggedEntry[], emptyMessage: string }) {
    const { entries, emptyMessage } = props;
    if (entries.length === 0) {
        return <p className={styles.none}>{emptyMessage}</p>;
    }
    return (
        <ul className={styles.entries}>
            {entries.map((entry) => (
                <li key={entry.id}>
                    <AdminEditLink
                        entity="timeEntry"
                        id={entry.id}
                    >
                        {[
                            formatDate(entry.date),
                            formatHours(entry.hours),
                            [entry.project.name, entry.taskName.trim()].filter(Boolean).join(' › '),
                        ].filter(Boolean).join(', ')}
                    </AdminEditLink>
                    <span className={styles.description}>
                        {entry.description.trim() || 'No description'}
                    </span>
                </li>
            ))}
        </ul>
    );
}

interface PersonPanelData {
    user: {
        id: string;
        displayName: string;
        displayPicture?: string | null;
    };
    days: OccupancyDay[];
    summary: {
        hours: number;
        expectedHours: number;
        occupancy?: number | null;
        missingDays: number;
        lateDays: number;
        lateShare?: number | null;
        standupDays: number;
        leaveDays: number;
        workFromHomeDays: number;
        nonWorkingDayHours: number;
        onLeaveHours: number;
    };
    longDates: string[];
    flaggedEntries: FlaggedEntry[];
    projects: {
        project: { id: string, name: string };
        hours: number;
        share?: number | null;
    }[];
}

interface MonthTrendProps {
    // Oldest first, ending with the current month
    months: { startDate: string, value?: number | null }[];
    // Bars above this are drawn at the top
    max: number;
    // A line across the bars marks this value
    fullValue?: number;
    formatValue: (value: number | null | undefined) => string;
}

function MonthTrend(props: MonthTrendProps) {
    const {
        months,
        max,
        fullValue,
        formatValue,
    } = props;

    return (
        <ol
            className={styles.trend}
            style={isDefined(fullValue)
                ? { '--full-height': fullValue / max } as React.CSSProperties
                : undefined}
        >
            {months.map((month, index) => {
                const isCurrent = index === months.length - 1;
                const height = Math.min(month.value ?? 0, max) / max;
                return (
                    <li
                        key={month.startDate}
                        className={_cs(styles.month, isCurrent && styles.current)}
                    >
                        <span className={styles.monthValue}>
                            {formatValue(month.value)}
                        </span>
                        <span
                            className={styles.track}
                            aria-hidden
                        >
                            <span
                                className={styles.bar}
                                style={{ '--bar-height': height } as React.CSSProperties}
                            />
                        </span>
                        <span className={styles.monthLabel}>
                            {monthFormatter.format(decodeDate(month.startDate))}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

interface Props {
    className?: string;
    person: PersonPanelData;
    period: string;
    endDate: string;
    onClose: () => void;
}

function PersonPanel(props: Props) {
    const {
        className,
        person,
        period,
        endDate,
        onClose,
    } = props;

    const {
        user,
        days,
        summary,
        longDates,
        flaggedEntries,
        projects,
    } = person;

    const headingId = useId();
    const headingRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        headingRef.current?.focus();
    }, [user.id]);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        },
        [onClose],
    );
    useKeybind(handleKeyDown);

    const [personResponse] = useQuery<OccupancyPersonQuery, OccupancyPersonQueryVariables>({
        query: OCCUPANCY_PERSON_QUERY,
        variables: { userId: user.id, endDate },
    });
    const history = personResponse.data?.private.occupancyPerson;
    const trendMonths = history?.months.filter(
        (month) => month.startDate >= TREND_START_DATE,
    );

    // Same as the cells marked as having no hours
    const isMissing = (day: OccupancyDay) => (
        isNotDefined(day.occupancy)
        && (day.expectedHours ?? 0) > 0
        && !day.isPending
    );
    const entriesItem = (date: string, label: string) => ({
        date,
        label,
        href: getAdminDayUrl('track/timeentry', user.id, date),
    });
    const journalItem = (date: string, label: string) => ({
        date,
        label,
        href: getAdminDayUrl('journal/journal', user.id, date),
    });
    const missingDates = days
        .filter(isMissing)
        .map((day) => entriesItem(day.date, formatDate(day.date)));
    const lateDays = days.flatMap((day) => {
        if (day.loggedDuringStandup) {
            return [entriesItem(day.date, `${formatDate(day.date)}, during standup`)];
        }
        if (isDefined(day.lateByDays)) {
            const firstEntryDate = formatDate(addDays(day.date, day.lateByDays));
            return [entriesItem(day.date, `${formatDate(day.date)}, first entry on ${firstEntryDate}`)];
        }
        return [];
    });
    const leaveDays = days
        .filter((day) => isDefined(day.leave))
        .map((day) => {
            const half = day.leave ? halfLabels[day.leave] : undefined;
            return journalItem(day.date, half ? `${formatDate(day.date)} (${half})` : formatDate(day.date));
        });
    const workFromHomeDays = days
        .filter((day) => isDefined(day.workFromHome))
        .map((day) => {
            const half = day.workFromHome ? halfLabels[day.workFromHome] : undefined;
            return journalItem(day.date, half ? `${formatDate(day.date)} (${half})` : formatDate(day.date));
        });
    const hoursByDate = new Map(days.map((day) => [day.date, day.hours]));
    const longDays = longDates.map((date) => {
        const hours = hoursByDate.get(date);
        return entriesItem(date, isDefined(hours) ? `${formatDate(date)}, ${formatHours(hours)}` : formatDate(date));
    });

    const longEntries = flaggedEntries.filter((entry) => entry.isLong);
    const vagueEntries = flaggedEntries.filter((entry) => entry.isVague);

    const topProjects = projects.slice(0, TOP_PROJECTS);
    const otherProjects = projects.slice(TOP_PROJECTS);
    const otherHours = otherProjects.reduce((total, item) => total + item.hours, 0);

    return (
        <section
            className={_cs(styles.personPanel, className)}
            role="dialog"
            aria-modal="false"
            aria-labelledby={headingId}
        >
            <header className={styles.header}>
                <DisplayPicture
                    className={styles.displayPicture}
                    imageUrl={user.displayPicture}
                    displayName={user.displayName}
                />
                <div className={styles.headingSection}>
                    <h2
                        ref={headingRef}
                        id={headingId}
                        className={styles.heading}
                        tabIndex={-1}
                    >
                        {user.displayName}
                    </h2>
                    <div className={styles.period}>
                        {`${period} · ${formatPercent(summary.occupancy)} occupancy`}
                    </div>
                </div>
                <Button
                    className={styles.closeButton}
                    name={undefined}
                    onClick={onClose}
                    title={`Close ${user.displayName}`}
                    variant="transparent"
                >
                    <RiCloseLine />
                </Button>
            </header>
            <div className={styles.content}>
                <section className={styles.section}>
                    <h3 className={styles.sectionHeading}>
                        {`Missing · ${formatDays(missingDates.length)}`}
                    </h3>
                    <DateList
                        items={missingDates}
                        emptyMessage="Every working day has hours or full leave"
                    />
                </section>
                <section className={styles.section}>
                    <h3 className={styles.sectionHeading}>
                        {[
                            `Logged late · ${formatDays(summary.lateDays)}`,
                            isDefined(summary.lateShare) && `${formatShare(summary.lateShare)} of days due`,
                            summary.standupDays > 0 && `${countFormatter.format(summary.standupDays)} during standup`,
                        ].filter(Boolean).join(', ')}
                    </h3>
                    <DateList
                        items={lateDays}
                        emptyMessage="Every day due with hours was logged on time"
                    />
                </section>
                <section className={styles.section}>
                    <h3 className={styles.sectionHeading}>
                        {`Leave · ${formatDays(summary.leaveDays)}`}
                    </h3>
                    <DateList
                        items={leaveDays}
                        emptyMessage="No leave"
                    />
                    {history && (
                        <p className={styles.note}>
                            {`${formatDays(history.leaveDaysThisYear)} of leave in ${endDate.slice(0, 4)} up to ${formatDate(endDate)}, on working days`}
                        </p>
                    )}
                </section>
                <section className={styles.section}>
                    <h3 className={styles.sectionHeading}>
                        {`WFH · ${formatDays(summary.workFromHomeDays)}`}
                    </h3>
                    <DateList
                        items={workFromHomeDays}
                        emptyMessage="No days worked from home"
                    />
                </section>
                <section className={styles.section}>
                    <h3 className={styles.sectionHeading}>
                        Hours on days off
                    </h3>
                    <dl className={styles.facts}>
                        <dt>Weekends, holidays and retreats</dt>
                        <dd>{formatHours(summary.nonWorkingDayHours)}</dd>
                        <dt>Days of full leave</dt>
                        <dd>{formatHours(summary.onLeaveHours)}</dd>
                    </dl>
                </section>
                <section className={styles.section}>
                    <h3 className={styles.sectionHeading}>
                        {`Long days, over ${LONG_DAY_HOURS}h · ${longDays.length}`}
                    </h3>
                    <DateList
                        items={longDays}
                        emptyMessage={`No days over ${LONG_DAY_HOURS}h`}
                    />
                </section>
                <section className={styles.section}>
                    <h3 className={styles.sectionHeading}>
                        {`Long entries, ${LONG_ENTRY_HOURS}h or more · ${longEntries.length}`}
                    </h3>
                    <EntryList
                        entries={longEntries}
                        emptyMessage={`No entries of ${LONG_ENTRY_HOURS}h or more`}
                    />
                </section>
                <section className={styles.section}>
                    <h3 className={styles.sectionHeading}>
                        {`Vague entries · ${vagueEntries.length}`}
                    </h3>
                    <EntryList
                        entries={vagueEntries}
                        emptyMessage="No vague entries"
                    />
                    <p className={styles.note}>
                        {`Entries with ${VAGUE_DESCRIPTION}`}
                    </p>
                </section>
                <section className={styles.section}>
                    <h3 className={styles.sectionHeading}>
                        Occupancy by month, %
                    </h3>
                    {trendMonths ? (
                        <MonthTrend
                            months={trendMonths.map((month) => ({
                                startDate: month.startDate,
                                value: month.occupancy,
                            }))}
                            max={MAX_TREND_OCCUPANCY}
                            fullValue={1}
                            formatValue={formatPercentNumber}
                        />
                    ) : (
                        <p className={styles.none}>
                            {personResponse.error ? 'Could not load the months' : 'Loading'}
                        </p>
                    )}
                </section>
                <section className={styles.section}>
                    <h3 className={styles.sectionHeading}>
                        Logged late by month, %
                    </h3>
                    {trendMonths ? (
                        <MonthTrend
                            months={trendMonths.map((month) => ({
                                startDate: month.startDate,
                                value: month.lateShare,
                            }))}
                            max={1}
                            formatValue={formatPercentNumber}
                        />
                    ) : (
                        <p className={styles.none}>
                            {personResponse.error ? 'Could not load the months' : 'Loading'}
                        </p>
                    )}
                </section>
                <section className={styles.section}>
                    <h3 className={styles.sectionHeading}>
                        Leave days by month
                    </h3>
                    {trendMonths ? (
                        <MonthTrend
                            months={trendMonths.map((month) => ({
                                startDate: month.startDate,
                                value: month.leaveDays,
                            }))}
                            max={Math.max(1, ...trendMonths.map((month) => month.leaveDays))}
                            formatValue={formatDayCount}
                        />
                    ) : (
                        <p className={styles.none}>
                            {personResponse.error ? 'Could not load the months' : 'Loading'}
                        </p>
                    )}
                </section>
                <section className={styles.section}>
                    <h3 className={styles.sectionHeading}>
                        WFH days by month
                    </h3>
                    {trendMonths ? (
                        <MonthTrend
                            months={trendMonths.map((month) => ({
                                startDate: month.startDate,
                                value: month.workFromHomeDays,
                            }))}
                            max={Math.max(1, ...trendMonths.map((month) => month.workFromHomeDays))}
                            formatValue={formatDayCount}
                        />
                    ) : (
                        <p className={styles.none}>
                            {personResponse.error ? 'Could not load the months' : 'Loading'}
                        </p>
                    )}
                </section>
                <section className={styles.section}>
                    <h3 className={styles.sectionHeading}>
                        {`Projects · ${projects.length}`}
                    </h3>
                    {projects.length > 0 ? (
                        <table className={styles.projects}>
                            <thead>
                                <tr>
                                    <th scope="col">Project</th>
                                    <th scope="col">Hours</th>
                                    <th scope="col">Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProjects.map((item) => (
                                    <tr key={item.project.id}>
                                        <th scope="row">{item.project.name}</th>
                                        <td>{formatHours(item.hours)}</td>
                                        <td>{formatPercent(item.share)}</td>
                                    </tr>
                                ))}
                                {otherProjects.length > 0 && (
                                    <tr>
                                        <th scope="row">
                                            {`${otherProjects.length} other ${otherProjects.length === 1 ? 'project' : 'projects'}`}
                                        </th>
                                        <td>{formatHours(otherHours)}</td>
                                        <td>
                                            {summary.hours > 0
                                                ? formatPercent(otherHours / summary.hours)
                                                : 'n/a'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <p className={styles.none}>No hours logged</p>
                    )}
                </section>
            </div>
        </section>
    );
}

export default PersonPanel;
