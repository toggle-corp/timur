import {
    compareNumber,
    compareString,
    isDefined,
} from '@togglecorp/fujs';

import { type KeyFigure } from '#components/KeyFigures';
import {
    getOccupancyStep,
    type OccupancyStep,
} from '#components/OccupancyHeatmap/utils';
import {
    addDays,
    formatHours,
    formatShare,
} from '#utils/common';
import {
    getMonth,
    getMonthDates,
} from '#utils/month';

// Match LOGGING_DEADLINE and STANDUP_DURATION in the backend
const LOGGING_DEADLINE = '9:15 on the next working day, skipping full leave';
const STANDUP_WINDOW = '9:15 to 9:30 on the next working day, skipping full leave';
// Match LONG_ENTRY_HOURS and the VAGUE_ constants in the backend
export const LONG_ENTRY_HOURS = 6;
export const VAGUE_DESCRIPTION = 'a description of one word or none, or of two words on entries of 2h or more';

// The current month runs up to yesterday, so it has no range on its first day
export function getMonthDateRange(month: string, today: string) {
    const { startDate, endDate: monthEndDate } = getMonthDates(month);
    const endDate = month === getMonth(today) ? addDays(today, -1) : monthEndDate;
    if (endDate < startDate) {
        return undefined;
    }
    return { startDate, endDate };
}

export interface OccupancySummary {
    hours: number;
    expectedHours: number;
    occupancy?: number | null;
    leaveDays: number;
    workFromHomeDays: number;
    missingDays: number;
    missingShare?: number | null;
    lateDays: number;
    lateShare?: number | null;
    standupDays: number;
    standupShare?: number | null;
    entries: number;
    longEntries: number;
    longEntryShare?: number | null;
    vagueEntries: number;
    vagueEntryShare?: number | null;
    projectsPerDay?: number | null;
    // Other than the blanket project
    topProject?: ProjectShare;
    projectCount: number;
}

type SummaryKey = 'hours' | 'expectedHours' | 'occupancy'
    | 'leaveDays' | 'workFromHomeDays' | 'missingDays' | 'missingShare' | 'lateDays' | 'lateShare' | 'standupDays' | 'standupShare' | 'entries'
    | 'longEntries' | 'longEntryShare' | 'vagueEntries' | 'vagueEntryShare' | 'topProject'
    | 'projectsPerDay' | 'projectCount';

// Percentages from these on are a warning and an alert
const WARNING_PERCENT = 10;
const ALERT_PERCENT = 30;

type SummaryLevel = OccupancyStep | 'warning' | 'alert';

function getPercent(share: number | null | undefined) {
    return isDefined(share) ? Math.round(share * 100) : undefined;
}

// From the rounded percentage, so the colour agrees with the number shown
function getShareLevel(share: number | null | undefined): SummaryLevel | undefined {
    const percent = getPercent(share);
    if (!isDefined(percent) || percent < WARNING_PERCENT) {
        return undefined;
    }
    return percent < ALERT_PERCENT ? 'warning' : 'alert';
}

export type OccupancyView = 'occupancy' | 'projects' | 'timeliness' | 'quality';

// In display order
export const OCCUPANCY_VIEWS: { key: OccupancyView, label: string }[] = [
    { key: 'occupancy', label: 'Occupancy' },
    { key: 'projects', label: 'Projects' },
    { key: 'timeliness', label: 'Timeliness' },
    { key: 'quality', label: 'Logging quality' },
];

export const DEFAULT_VIEW: OccupancyView = 'occupancy';

export interface SummaryColumn {
    key: SummaryKey;
    // Shown in this view only; the CSV has every column
    view?: OccupancyView;
    label: string;
    description: string;
    // Sorts by, and fills the CSV unless getCsvValue is set
    getValue: (summary: OccupancySummary) => number | string | undefined;
    getCsvValue?: (summary: OccupancySummary) => string | undefined;
    // Colours the cell
    getLevel?: (summary: OccupancySummary) => SummaryLevel | undefined;
    // Text reads best A to Z, while metrics are most useful largest first
    isText?: boolean;
}

interface ProjectShare {
    name: string;
    share?: number | null;
}

interface ProjectHours {
    project: { id: string, name: string };
    hours: number;
    share?: number | null;
}

// Projects of everyone listed in the key figures of the projects view
const TEAM_TOP_PROJECTS = 5;
// Matches BLANKET_PROJECT_NAME in the backend occupancy
const BLANKET_PROJECT_NAME = 'Togglecorp';
// Projects per day from these on are a warning and an alert
const WARNING_PROJECTS_PER_DAY = 2.5;
const ALERT_PROJECTS_PER_DAY = 3.5;

export function getProjectSummary(
    projects: ProjectHours[],
    topProject: ProjectHours | null | undefined,
) {
    return {
        topProject: topProject
            ? { name: topProject.project.name, share: topProject.share }
            : undefined,
        projectCount: projects.length,
    };
}

export function formatTopProjectShare(share: number | null | undefined) {
    return isDefined(share) ? formatShare(share) : undefined;
}

export const SUMMARY_COLUMNS: SummaryColumn[] = [
    {
        key: 'hours',
        view: 'occupancy',
        label: 'Hours',
        description: 'Hours logged',
        getValue: (summary) => summary.hours,
    },
    {
        key: 'expectedHours',
        view: 'occupancy',
        label: 'Expected',
        description: 'Expected hours: 7h per working day, 3.5h on half leave',
        getValue: (summary) => summary.expectedHours,
    },
    {
        key: 'occupancy',
        view: 'occupancy',
        label: 'Occupancy',
        description: 'Occupancy: hours logged ÷ expected hours',
        getValue: (summary) => getPercent(summary.occupancy),
        getLevel: (summary) => {
            const percent = getPercent(summary.occupancy);
            return isDefined(percent) ? getOccupancyStep(percent) : undefined;
        },
    },
    {
        key: 'leaveDays',
        view: 'occupancy',
        label: 'Leave',
        description: 'Leave days, with half days as 0.5',
        getValue: (summary) => summary.leaveDays,
    },
    {
        key: 'workFromHomeDays',
        view: 'occupancy',
        label: 'WFH',
        description: 'WFH days',
        getValue: (summary) => summary.workFromHomeDays,
    },
    {
        key: 'missingDays',
        view: 'timeliness',
        label: 'Missing',
        description: 'Missing days: days due without hours. Days due are working days, other than full leave, past their deadline.',
        getValue: (summary) => summary.missingDays,
    },
    {
        key: 'missingShare',
        view: 'timeliness',
        label: 'Missing %',
        description: 'Missing days as a share of days due',
        getValue: (summary) => getPercent(summary.missingShare),
        getLevel: (summary) => getShareLevel(summary.missingShare),
    },
    {
        key: 'lateDays',
        view: 'timeliness',
        label: 'Logged late',
        description: `Days logged late: days due whose first entry was created at or after ${LOGGING_DEADLINE}. Days without hours are missing, not logged late.`,
        getValue: (summary) => summary.lateDays,
    },
    {
        key: 'lateShare',
        view: 'timeliness',
        label: 'Logged late %',
        description: 'Days logged late as a share of days due: working days other than full leave, past their deadline',
        getValue: (summary) => getPercent(summary.lateShare),
        getLevel: (summary) => getShareLevel(summary.lateShare),
    },
    {
        key: 'standupDays',
        view: 'timeliness',
        label: 'During standup',
        description: `Days logged during the standup: days logged late whose first entry was created from ${STANDUP_WINDOW}`,
        getValue: (summary) => summary.standupDays,
    },
    {
        key: 'standupShare',
        view: 'timeliness',
        label: 'During standup %',
        description: 'Days logged during the standup as a share of days due',
        getValue: (summary) => getPercent(summary.standupShare),
        getLevel: (summary) => getShareLevel(summary.standupShare),
    },
    {
        key: 'entries',
        view: 'quality',
        label: 'Entries',
        description: 'Time entries with hours, other than TODO',
        getValue: (summary) => summary.entries,
    },
    {
        key: 'longEntries',
        view: 'quality',
        label: 'Long',
        description: `Long entries: entries of ${LONG_ENTRY_HOURS}h or more`,
        getValue: (summary) => summary.longEntries,
    },
    {
        key: 'longEntryShare',
        view: 'quality',
        label: 'Long %',
        description: 'Hours in long entries as a share of the hours logged',
        getValue: (summary) => getPercent(summary.longEntryShare),
        getLevel: (summary) => getShareLevel(summary.longEntryShare),
    },
    {
        key: 'vagueEntries',
        view: 'quality',
        label: 'Vague',
        description: `Vague entries: entries with ${VAGUE_DESCRIPTION}`,
        getValue: (summary) => summary.vagueEntries,
    },
    {
        key: 'vagueEntryShare',
        view: 'quality',
        label: 'Vague %',
        description: 'Vague entries as a share of the time entries with hours',
        getValue: (summary) => getPercent(summary.vagueEntryShare),
        getLevel: (summary) => getShareLevel(summary.vagueEntryShare),
    },
    {
        key: 'topProject',
        view: 'projects',
        label: 'Top project',
        description: `Project with the most hours other than ${BLANKET_PROJECT_NAME}, and its share of the hours outside ${BLANKET_PROJECT_NAME}. A share near 100% means one project only.`,
        getValue: (summary) => summary.topProject?.name,
        getCsvValue: (summary) => summary.topProject && [
            summary.topProject.name,
            formatTopProjectShare(summary.topProject.share),
        ].filter(isDefined).join(' · '),
        isText: true,
    },
    {
        key: 'projectsPerDay',
        view: 'projects',
        label: 'Projects per day',
        description: `Projects per day with hours, other than ${BLANKET_PROJECT_NAME}. A high number means a lot of switching between projects.`,
        getValue: (summary) => summary.projectsPerDay ?? undefined,
        getLevel: (summary) => {
            const value = summary.projectsPerDay;
            if (!isDefined(value) || value < WARNING_PROJECTS_PER_DAY) {
                return undefined;
            }
            return value < ALERT_PROJECTS_PER_DAY ? 'warning' : 'alert';
        },
    },
    {
        key: 'projectCount',
        view: 'projects',
        label: 'Projects',
        description: 'Projects with hours logged',
        getValue: (summary) => summary.projectCount,
    },
];

// Data before 2026 is not comparable, so trends start here
export const TREND_START_DATE = '2026-01-01';

interface KeyFigureTotals {
    hours: number;
    occupancy?: number | null;
    longEntryShare?: number | null;
    vagueEntryShare?: number | null;
    missingDays: number;
    missingPeople: number;
    lateShare?: number | null;
    standupDays: number;
    leaveDays: number;
    workFromHomeDays: number;
    leaveConflictDays: number;
    nonWorkingDayHours: number;
}

const NO_FIGURE = 'n/a';
const countFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

// The summary strip: totals of everyone listed, against the previous period
export function getKeyFigures(
    totals: KeyFigureTotals,
    previous: KeyFigureTotals,
): (KeyFigure & { view: OccupancyView })[] {
    return [
        {
            key: 'occupancy',
            view: 'occupancy',
            label: 'Occupancy',
            value: isDefined(totals.occupancy) ? formatShare(totals.occupancy) : NO_FIGURE,
            current: totals.occupancy,
            previous: previous.occupancy,
            unit: 'points',
            better: { target: 1 },
            definition: 'Hours logged ÷ expected hours, over everyone listed, billable or not. Hours on weekends, holidays and leave count, so it can pass 100%.',
        },
        {
            key: 'missingDays',
            view: 'timeliness',
            label: 'Missing days',
            value: countFormatter.format(totals.missingDays),
            current: totals.missingDays,
            previous: previous.missingDays,
            unit: 'count',
            better: 'lower',
            definition: 'Working days, other than full leave, without hours, added up over everyone listed. Days before someone joined do not count, and neither does a day not due yet.',
        },
        {
            key: 'missingPeople',
            view: 'timeliness',
            label: 'People with missing days',
            value: countFormatter.format(totals.missingPeople),
            current: totals.missingPeople,
            previous: previous.missingPeople,
            unit: 'count',
            better: 'lower',
            definition: 'People with at least one missing day.',
        },
        {
            key: 'lateShare',
            view: 'timeliness',
            label: 'Logged late',
            value: isDefined(totals.lateShare) ? formatShare(totals.lateShare) : NO_FIGURE,
            current: totals.lateShare,
            previous: previous.lateShare,
            unit: 'points',
            better: 'lower',
            definition: `Days due whose first entry was created at or after ${LOGGING_DEADLINE}, ÷ days due, added up over everyone listed. Days without hours are missing, not logged late. Full leave days and days not due yet do not count. An entry is created when it is first saved, so imported entries count as logged late.`,
        },
        {
            key: 'standupDays',
            view: 'timeliness',
            label: 'During standup',
            value: countFormatter.format(totals.standupDays),
            current: totals.standupDays,
            previous: previous.standupDays,
            unit: 'count',
            better: 'lower',
            definition: `Working days whose first entry was created from ${STANDUP_WINDOW}, too late to talk about in the standup. These days are also logged late.`,
        },
        {
            key: 'leaveDays',
            view: 'occupancy',
            label: 'Leave days',
            value: countFormatter.format(totals.leaveDays),
            current: totals.leaveDays,
            previous: previous.leaveDays,
            unit: 'count',
            better: 'lower',
            definition: 'Days of leave, with a half day as 0.5.',
        },
        {
            key: 'workFromHomeDays',
            view: 'occupancy',
            label: 'WFH days',
            value: countFormatter.format(totals.workFromHomeDays),
            current: totals.workFromHomeDays,
            previous: previous.workFromHomeDays,
            unit: 'count',
            better: 'lower',
            definition: 'Days worked from home, with a half day as 0.5.',
        },
        {
            key: 'leaveConflictDays',
            view: 'quality',
            label: 'Full leave days with hours',
            value: countFormatter.format(totals.leaveConflictDays),
            current: totals.leaveConflictDays,
            previous: previous.leaveConflictDays,
            unit: 'count',
            better: 'lower',
            definition: 'Days of full leave with hours logged. Either the leave or the entries need a correction.',
        },
        {
            key: 'nonWorkingDayHours',
            view: 'occupancy',
            label: 'Non-working day hours',
            value: formatHours(totals.nonWorkingDayHours),
            current: totals.nonWorkingDayHours,
            previous: previous.nonWorkingDayHours,
            unit: 'hours',
            better: 'lower',
            definition: 'Hours logged on weekends, holidays and retreats. They count towards hours logged but not expected hours, so occupancy can pass 100%.',
        },
        {
            key: 'longEntryShare',
            view: 'quality',
            label: 'Long entries',
            value: isDefined(totals.longEntryShare)
                ? formatShare(totals.longEntryShare)
                : NO_FIGURE,
            current: totals.longEntryShare,
            previous: previous.longEntryShare,
            unit: 'points',
            better: 'lower',
            definition: `Hours in entries of ${LONG_ENTRY_HOURS}h or more ÷ hours logged, over everyone listed.`,
        },
        {
            key: 'vagueEntryShare',
            view: 'quality',
            label: 'Vague entries',
            value: isDefined(totals.vagueEntryShare)
                ? formatShare(totals.vagueEntryShare)
                : NO_FIGURE,
            current: totals.vagueEntryShare,
            previous: previous.vagueEntryShare,
            unit: 'points',
            better: 'lower',
            definition: `Entries with ${VAGUE_DESCRIPTION} ÷ time entries with hours, over everyone listed.`,
        },
    ];
}

interface CsvRow {
    name: string;
    days: {
        date: string;
        hours?: number | null;
        leave?: string | null;
    }[];
    summary: OccupancySummary;
}

const FULL_LEAVE_CSV_VALUE = 'Leave';

function escapeCsvValue(value: string | number | undefined | null) {
    const text = isDefined(value) ? String(value) : '';
    if (/[",\r\n]/.test(text)) {
        return `"${text.replaceAll('"', '""')}"`;
    }
    return text;
}

// Day columns hold hours logged, or "Leave" for a full day of leave with any hours in brackets
export function buildOccupancyCsv(dates: string[], rows: CsvRow[]) {
    const header = [
        'Name',
        ...dates,
        ...SUMMARY_COLUMNS.map((column) => column.description),
    ];
    const lines = rows.map((row) => {
        const daysByDate = new Map(row.days.map((day) => [day.date, day]));
        return [
            row.name,
            ...dates.map((date) => {
                const day = daysByDate.get(date);
                if (day?.leave !== 'FULL') {
                    return day?.hours;
                }
                return isDefined(day.hours)
                    ? `${FULL_LEAVE_CSV_VALUE} (${day.hours})`
                    : FULL_LEAVE_CSV_VALUE;
            }),
            ...SUMMARY_COLUMNS.map((column) => (
                column.getCsvValue ?? column.getValue
            )(row.summary)),
        ];
    });
    return [header, ...lines]
        .map((line) => line.map(escapeCsvValue).join(','))
        .join('\r\n');
}

export type SortKey = 'name' | SummaryKey;
export type SortDirection = 'asc' | 'desc';

// Kept out of the URL
export const DEFAULT_SORT: { key: SortKey, direction: SortDirection } = {
    key: 'name',
    direction: 'asc',
};

interface SortableRow {
    name: string;
    summary: OccupancySummary;
}

// Rows without a value stay last in both directions, and ties fall back to the name
export function sortOccupancyRows<ROW extends SortableRow>(
    rows: ROW[],
    key: SortKey,
    direction: SortDirection,
) {
    const sign = direction === 'asc' ? 1 : -1;
    const column = SUMMARY_COLUMNS.find((item) => item.key === key);
    return [...rows].sort((foo, bar) => {
        const byName = compareString(foo.name, bar.name);
        if (!column) {
            return sign * byName;
        }
        const fooValue = column.getValue(foo.summary);
        const barValue = column.getValue(bar.summary);
        if (!isDefined(fooValue) || !isDefined(barValue)) {
            return compareNumber(Number(!isDefined(fooValue)), Number(!isDefined(barValue)))
                || byName;
        }
        const byValue = typeof fooValue === 'string' || typeof barValue === 'string'
            ? compareString(String(fooValue), String(barValue))
            : compareNumber(fooValue, barValue);
        return sign * byValue || byName;
    });
}

// The projects with the most hours over everyone listed, with no comparison to the previous period
export function getTeamProjectFigures(
    users: { projects: ProjectHours[] }[],
    hours: number,
): KeyFigure[] {
    const hoursByProject = new Map<string, { name: string, hours: number }>();
    users.forEach(({ projects }) => projects.forEach((item) => {
        const total = hoursByProject.get(item.project.id)?.hours ?? 0;
        hoursByProject.set(item.project.id, { name: item.project.name, hours: total + item.hours });
    }));
    return [...hoursByProject.entries()]
        .sort(([, foo], [, bar]) => (
            compareNumber(bar.hours, foo.hours) || compareString(foo.name, bar.name)
        ))
        .slice(0, TEAM_TOP_PROJECTS)
        .map(([id, item]) => ({
            key: id,
            label: item.name,
            value: hours ? formatShare(item.hours / hours) : NO_FIGURE,
            detail: formatHours(item.hours),
            current: undefined,
            previous: undefined,
            unit: 'hours',
            definition: `Hours logged on ${item.name} ÷ hours logged, over everyone listed.`,
        }));
}
