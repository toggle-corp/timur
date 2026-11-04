import {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
} from 'react';
import {
    RiArrowDownSLine,
    RiArrowUpSLine,
    RiDownloadLine,
} from 'react-icons/ri';
import {
    useLocation,
    useParams,
} from 'react-router-dom';
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

import Button from '#components/Button';
import DefaultMessage from '#components/DefaultMessage';
import KeyFigures from '#components/KeyFigures';
import MonthNavigation from '#components/MonthNavigation';
import OccupancyHeatmap, { OccupancyLegend } from '#components/OccupancyHeatmap';
import Page from '#components/Page';
import Portal from '#components/Portal';
import RawButton from '#components/RawButton';
import DateContext from '#contexts/date';
import NavbarContext from '#contexts/navbar';
import UserContext from '#contexts/user';
import {
    type OccupancyQuery,
    type OccupancyQueryVariables,
} from '#generated/types/graphql';
import useUrlQueryState from '#hooks/useUrlQueryState';
import { getAdminDayUrl } from '#utils/admin';
import { formatNumber } from '#utils/common';
import {
    formatMonth,
    getMonth,
    parseMonth,
} from '#utils/month';

import PersonPanel from './PersonPanel';
import {
    buildOccupancyCsv,
    DEFAULT_SORT,
    DEFAULT_VIEW,
    formatTopProjectShare,
    getKeyFigures,
    getMonthDateRange,
    getProjectSummary,
    getTeamProjectFigures,
    OCCUPANCY_VIEWS,
    type OccupancySummary,
    type OccupancyView,
    type SortDirection,
    type SortKey,
    sortOccupancyRows,
    SUMMARY_COLUMNS,
    type SummaryColumn,
    TREND_START_DATE,
} from './utils';

import styles from './styles.module.css';

const OCCUPANCY_QUERY = gql`
    query Occupancy($startDate: Date!, $endDate: Date!) {
        private {
            id
            occupancy(startDate: $startDate, endDate: $endDate) {
                id
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
                        leaveDisplay
                        workFromHome
                        occupancy
                        entries
                        expectedHours
                        lateByDays
                        loggedDuringStandup
                        isPending
                    }
                    summary {
                        hours
                        expectedHours
                        occupancy
                        leaveDays
                        workFromHomeDays
                        missingDays
                        missingShare
                        lateDays
                        lateShare
                        standupDays
                        standupShare
                        projectsPerDay
                        nonWorkingDayHours
                        onLeaveHours
                        entries
                        longEntries
                        longEntryShare
                        vagueEntries
                        vagueEntryShare
                    }
                    longDates
                    topProject {
                        project {
                            id
                            name
                        }
                        hours
                        share
                    }
                    flaggedEntries {
                        id
                        date
                        hours
                        description
                        project {
                            id
                            name
                        }
                        taskName
                        isLong
                        isVague
                    }
                    projects {
                        project {
                            id
                            name
                        }
                        hours
                        share
                    }
                }
                summary {
                    hours
                    missingDays
                    lateShare
                    standupDays
                    leaveDays
                    workFromHomeDays
                    leaveConflictDays
                    nonWorkingDayHours
                    occupancy
                    longEntryShare
                    vagueEntryShare
                }
                missingPeople
                previous {
                    startDate
                    endDate
                    summary {
                        hours
                        missingDays
                        lateShare
                        standupDays
                        leaveDays
                        workFromHomeDays
                        leaveConflictDays
                        nonWorkingDayHours
                        occupancy
                        longEntryShare
                        vagueEntryShare
                    }
                    missingPeople
                }
                daySummaries {
                    date
                    isWorkingDay
                    eventName
                }
                miscEvents {
                    id
                    name
                    startDate
                    endDate
                }
                dataAsOf
            }
        }
    }
`;

const dateFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
});
const shortMonthFormatter = new Intl.DateTimeFormat(undefined, { month: 'short' });
const shortMonthYearFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' });

const TOP_PROJECT_KEY: SortKey = 'topProject';

function SummaryCells(props: { summary: OccupancySummary, columns: SummaryColumn[] }) {
    const { summary, columns } = props;
    return (
        <>
            {columns.map((column) => {
                if (column.key === TOP_PROJECT_KEY) {
                    const project = summary.topProject;
                    const share = formatTopProjectShare(project?.share);
                    return (
                        <td
                            key={column.key}
                            className={_cs(
                                styles.summaryCell,
                                styles.topProjectCell,
                                styles.textColumn,
                            )}
                        >
                            {project ? (
                                <span className={styles.topProject}>
                                    <span
                                        className={styles.projectName}
                                        title={project.name}
                                    >
                                        {project.name}
                                    </span>
                                    {share && ` · ${share}`}
                                </span>
                            ) : '-'}
                        </td>
                    );
                }
                const value = column.getValue(summary);
                const level = column.getLevel?.(summary);
                return (
                    <td
                        key={column.key}
                        className={_cs(styles.summaryCell, level && styles[level])}
                    >
                        {typeof value === 'number' ? formatNumber(value) : '-'}
                    </td>
                );
            })}
        </>
    );
}

// Row keys are user IDs
function getTimeEntriesDayHref(userId: string, date: string) {
    return getAdminDayUrl('track/timeentry', userId, date);
}

const SORT_KEYS = new Set<string>(['name', ...SUMMARY_COLUMNS.map((column) => column.key)]);
const VIEW_KEYS = new Set<string>(OCCUPANCY_VIEWS.map((item) => item.key));

interface ViewSwitchProps {
    value: OccupancyView;
    onChange: (value: OccupancyView) => void;
}

function ViewSwitch(props: ViewSwitchProps) {
    const { value, onChange } = props;
    return (
        <div
            className={styles.viewSwitch}
            role="group"
            aria-label="View"
        >
            {OCCUPANCY_VIEWS.map((item) => (
                <RawButton
                    key={item.key}
                    className={styles.viewOption}
                    name={item.key}
                    onClick={onChange}
                    title={`Show ${item.label.toLowerCase()}`}
                    aria-pressed={item.key === value}
                >
                    {item.label}
                </RawButton>
            ))}
        </div>
    );
}

function getAriaSort(active: boolean, direction: SortDirection) {
    if (!active) {
        return undefined;
    }
    return direction === 'asc' ? 'ascending' : 'descending';
}

// Leaves a leading abbreviation such as WFH as it is
function lowerFirst(text: string) {
    if (text.charAt(1) !== text.charAt(1).toLowerCase()) {
        return text;
    }
    return text.charAt(0).toLowerCase() + text.slice(1);
}

interface SortButtonProps {
    sortKey: SortKey;
    label: string;
    // Read in place of a short label, and shown on hover and keyboard focus
    description?: string;
    active: boolean;
    direction: SortDirection;
    onClick: (key: SortKey) => void;
}

function SortButton(props: SortButtonProps) {
    const {
        sortKey,
        label,
        description,
        active,
        direction,
        onClick,
    } = props;

    let icon;
    if (active) {
        icon = direction === 'asc' ? <RiArrowUpSLine /> : <RiArrowDownSLine />;
    }

    return (
        <>
            <Button
                className={styles.sortButton}
                name={sortKey}
                onClick={onClick}
                variant="transparent"
                title={`Sort by ${lowerFirst(description ?? label)}`}
                actions={icon}
            >
                {description ? (
                    <>
                        <span aria-hidden>{label}</span>
                        <span className={styles.visuallyHidden}>{description}</span>
                    </>
                ) : label}
            </Button>
            {description && (
                <span
                    className={styles.tooltip}
                    aria-hidden
                >
                    {description}
                </span>
            )}
        </>
    );
}

function downloadCsv(fileName: string, content: string) {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
}

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const { month: monthFromParams } = useParams<{ month: string | undefined }>();
    const { search } = useLocation();
    const { fullDate } = useContext(DateContext);
    const { midActionsRef } = useContext(NavbarContext);
    const { userAuth } = useContext(UserContext);

    const currentMonth = getMonth(fullDate);
    const month = parseMonth(monthFromParams, fullDate);
    const dateRange = getMonthDateRange(month, fullDate);

    const [occupancyResponse] = useQuery<OccupancyQuery, OccupancyQueryVariables>({
        query: OCCUPANCY_QUERY,
        // NOTE: The query is paused when dateRange is not defined
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        variables: dateRange!,
        pause: !dateRange,
        requestPolicy: 'cache-and-network',
    });

    const occupancy = dateRange ? occupancyResponse.data?.private.occupancy : undefined;

    const [sort, setSort] = useUrlQueryState<typeof DEFAULT_SORT, 'sort' | 'order'>(
        ['sort', 'order'],
        (value) => ({
            key: value.sort && SORT_KEYS.has(value.sort) ? value.sort as SortKey : DEFAULT_SORT.key,
            direction: value.order === 'asc' || value.order === 'desc'
                ? value.order
                : DEFAULT_SORT.direction,
        }),
        (value) => {
            const isDefault = value.key === DEFAULT_SORT.key
                && value.direction === DEFAULT_SORT.direction;
            return {
                sort: isDefault ? undefined : value.key,
                order: isDefault ? undefined : value.direction,
            };
        },
    );

    const [selectedUserId, setSelectedUserId] = useUrlQueryState<string | undefined, 'user'>(
        ['user'],
        (value) => value.user ?? undefined,
        (value) => ({ user: value }),
    );

    const [view, setView] = useUrlQueryState<OccupancyView, 'view'>(
        ['view'],
        (value) => (
            value.view && VIEW_KEYS.has(value.view) ? value.view as OccupancyView : DEFAULT_VIEW
        ),
        (value) => ({ view: value === DEFAULT_VIEW ? undefined : value }),
    );
    const viewColumns = useMemo(
        () => SUMMARY_COLUMNS.filter((column) => column.view === view),
        [view],
    );
    // A sort by a column of another view stays in the URL for when that view is back
    const visibleSort = sort.key === 'name'
        || viewColumns.some((column) => column.key === sort.key)
        ? sort
        : DEFAULT_SORT;

    const handlePanelClose = useCallback(
        () => setSelectedUserId(undefined),
        [setSelectedUserId],
    );

    // However the panel closes, focus goes back to the name that opened it
    const previousSelectedUserIdRef = useRef(selectedUserId);
    useEffect(
        () => {
            const previousSelectedUserId = previousSelectedUserIdRef.current;
            previousSelectedUserIdRef.current = selectedUserId;
            if (isDefined(previousSelectedUserId) && isNotDefined(selectedUserId)) {
                document.querySelector<HTMLElement>(
                    `tbody button[name="${CSS.escape(previousSelectedUserId)}"]`,
                )?.focus();
            }
        },
        [selectedUserId],
    );

    const handleSortClick = useCallback(
        (key: SortKey) => {
            if (visibleSort.key === key) {
                setSort({ key, direction: visibleSort.direction === 'asc' ? 'desc' : 'asc' });
                return;
            }
            const isText = key === 'name'
                || SUMMARY_COLUMNS.find((column) => column.key === key)?.isText;
            setSort({ key, direction: isText ? 'asc' : 'desc' });
        },
        [setSort, visibleSort],
    );

    const users = useMemo(
        () => (occupancy?.users ?? []).map((item) => ({
            ...item,
            name: item.user.displayName,
            summary: { ...item.summary, ...getProjectSummary(item.projects, item.topProject) },
        })),
        [occupancy?.users],
    );

    const sortedUsers = useMemo(
        () => sortOccupancyRows(users, visibleSort.key, visibleSort.direction),
        [users, visibleSort.key, visibleSort.direction],
    );

    const eventNamesByDate = useMemo(
        () => {
            const value: Record<string, string> = {};
            occupancy?.daySummaries.forEach(({ date, eventName }) => {
                const names = [
                    eventName,
                    ...occupancy.miscEvents
                        .filter((event) => event.startDate <= date && date <= event.endDate)
                        .map((event) => event.name),
                ].filter(isDefined);
                if (names.length > 0) {
                    value[date] = names.join(', ');
                }
            });
            return value;
        },
        [occupancy],
    );

    const nonWorkingDates = useMemo(
        () => new Set(
            occupancy?.daySummaries
                .filter((day) => !day.isWorkingDay)
                .map((day) => day.date),
        ),
        [occupancy?.daySummaries],
    );

    const hasPending = useMemo(
        () => occupancy?.users.some((user) => user.days.some((day) => day.isPending)) ?? false,
        [occupancy?.users],
    );

    const handleExportClick = useCallback(
        () => {
            if (!occupancy) {
                return;
            }
            const csv = buildOccupancyCsv(occupancy.dates, users);
            downloadCsv(`timesheets-${month}.csv`, csv);
        },
        [occupancy, users, month],
    );

    const selectedUser = occupancy?.users.find((item) => item.user.id === selectedUserId);

    const isEmpty = !occupancy || occupancy.users.length === 0 || occupancy.dates.length === 0;

    // The current month runs up to yesterday
    const upToDate = dateRange && month === currentMonth
        ? dateFormatter.format(decodeDate(dateRange.endDate))
        : undefined;
    let description = formatMonth(month);
    if (upToDate) {
        description = `${description}, up to ${upToDate}`;
    }
    // The year shows only for a month of another year
    const heading = `${(month.slice(0, 4) === currentMonth.slice(0, 4)
        ? shortMonthFormatter
        : shortMonthYearFormatter
    ).format(decodeDate(`${month}-01`))} Timesheets`;

    let comparedTo;
    if (occupancy && occupancy.previous.startDate >= TREND_START_DATE) {
        const { startDate, endDate } = occupancy.previous;
        // A part of the current month compares with the same days of the previous one
        comparedTo = month === currentMonth
            ? dateFormatter.formatRange(decodeDate(startDate), decodeDate(endDate))
            : shortMonthFormatter.format(decodeDate(startDate));
    }

    return (
        <Page
            documentTitle={`Timur - ${heading}`}
            className={styles.occupancy}
            contentClassName={_cs(styles.content, selectedUser && styles.withPanel)}
        >
            <Portal container={midActionsRef}>
                <div className={styles.actions}>
                    <MonthNavigation
                        to="timesheets"
                        month={month}
                        currentMonth={currentMonth}
                        monthPathParam="month"
                        urlSearch={search}
                        withShortcuts
                    />
                    <div className={styles.spacer} />
                    <Button
                        name={undefined}
                        onClick={handleExportClick}
                        variant="tertiary"
                        title="Download this month as CSV"
                        disabled={isEmpty}
                        icons={<RiDownloadLine />}
                    >
                        CSV
                    </Button>
                </div>
            </Portal>
            <header className={styles.header}>
                <div className={styles.headingSection}>
                    <h1 className={styles.heading}>
                        {heading}
                    </h1>
                    {(upToDate || occupancy?.dataAsOf) && (
                        <div className={styles.dataAsOf}>
                            {[
                                upToDate && `Up to ${upToDate}`,
                                occupancy?.dataAsOf && `Last entry added ${dateFormatter.format(new Date(occupancy.dataAsOf))}`,
                            ].filter(Boolean).join(' · ')}
                        </div>
                    )}
                </div>
                {!isEmpty && (
                    <ViewSwitch
                        value={view}
                        onChange={setView}
                    />
                )}
            </header>
            {!isEmpty && (
                <KeyFigures
                    label={`Key figures, ${description}`}
                    figures={view === 'projects'
                        ? getTeamProjectFigures(occupancy.users, occupancy.summary.hours)
                        : getKeyFigures(
                            { ...occupancy.summary, missingPeople: occupancy.missingPeople },
                            {
                                ...occupancy.previous.summary,
                                missingPeople: occupancy.previous.missingPeople,
                            },
                        ).filter((figure) => figure.view === view)}
                    // The previous period has no project hours to compare with
                    comparedTo={view === 'projects' ? undefined : comparedTo}
                    compact
                />
            )}
            {!isEmpty && (
                <OccupancyHeatmap
                    className={styles.heatmap}
                    label={`Timesheets, ${description}`}
                    withGroupBands
                    withoutGroupHeadings
                    getDayHref={userAuth?.isStaff ? getTimeEntriesDayHref : undefined}
                    selectedRowKey={selectedUserId}
                    onSelectedRowKeyChange={setSelectedUserId}
                    dates={occupancy.dates}
                    userHeading={(
                        <SortButton
                            sortKey="name"
                            label="Team member"
                            active={visibleSort.key === 'name'}
                            direction={visibleSort.direction}
                            onClick={handleSortClick}
                        />
                    )}
                    userHeadingSort={getAriaSort(visibleSort.key === 'name', visibleSort.direction)}
                    rows={sortedUsers.map((item) => ({
                        key: item.user.id,
                        displayName: item.user.displayName,
                        displayPicture: item.user.displayPicture,
                        days: item.days,
                        trailingCells: (
                            <SummaryCells
                                summary={item.summary}
                                columns={viewColumns}
                            />
                        ),
                    }))}
                    trailingHeadings={viewColumns.map((column) => (
                        <th
                            key={column.key}
                            className={_cs(
                                styles.summaryHeading,
                                column.isText && styles.textColumn,
                            )}
                            aria-sort={getAriaSort(
                                visibleSort.key === column.key,
                                visibleSort.direction,
                            )}
                        >
                            <SortButton
                                sortKey={column.key}
                                label={column.label}
                                description={column.description}
                                active={visibleSort.key === column.key}
                                direction={visibleSort.direction}
                                onClick={handleSortClick}
                            />
                        </th>
                    ))}
                    dateMarkers={eventNamesByDate}
                    nonWorkingDates={nonWorkingDates}
                    loading={occupancyResponse.fetching}
                />
            )}
            {!isEmpty && (
                <OccupancyLegend
                    withPending={hasPending}
                    withLateLogging
                    withWorkFromHome
                    withNonWorkingDays
                    withEvents
                />
            )}
            {occupancy && occupancy.miscEvents.length > 0 && (
                <ul className={styles.events}>
                    {occupancy.miscEvents.map((event) => (
                        <li key={event.id}>
                            {dateFormatter.formatRange(
                                decodeDate(event.startDate),
                                decodeDate(event.endDate),
                            )}
                            {': '}
                            {event.name}
                        </li>
                    ))}
                </ul>
            )}
            {selectedUser && dateRange && (
                <PersonPanel
                    person={selectedUser}
                    period={description}
                    endDate={dateRange.endDate}
                    onClose={handlePanelClose}
                />
            )}
            <DefaultMessage
                className={styles.message}
                compact
                filtered={false}
                empty={isEmpty}
                pending={isEmpty && occupancyResponse.fetching}
                errored={!!occupancyResponse.error}
                pendingMessage="Crunching the numbers"
                errorMessage="Could not load the timesheets"
                emptyMessage="No working days to show yet!"
            />
        </Page>
    );
}

Component.displayName = 'Occupancy';
