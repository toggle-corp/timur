import {
    decodeDate,
    listToGroupList,
    mapToList,
} from '@togglecorp/fujs';

const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const WEEKDAY_LENGTH = 2;

export function formatWeekday(date: Date) {
    return weekdayFormatter.format(date).slice(0, WEEKDAY_LENGTH);
}

// ISO 8601 week number and the year the week belongs to
export function getIsoWeek(date: Date) {
    const value = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const weekday = value.getUTCDay() || 7;
    // Thursday decides which year the week belongs to
    value.setUTCDate(value.getUTCDate() + 4 - weekday);
    const year = value.getUTCFullYear();
    const yearStart = Date.UTC(year, 0, 1);
    const week = Math.ceil(((value.getTime() - yearStart) / 86400000 + 1) / 7);
    return { year, week };
}

interface DateGroup {
    key: string;
    label: string;
    firstDate: string;
    span: number;
}

// NOTE: dates must be sorted so that each group is contiguous
function groupDates(
    dates: string[],
    getKey: (date: Date) => string,
    getLabel: (date: Date) => string,
): DateGroup[] {
    const datesByKey = listToGroupList(
        dates,
        (value) => getKey(decodeDate(value)),
    );

    return mapToList(
        datesByKey,
        (groupedDates, key) => {
            // NOTE: listToGroupList only creates groups with at least one item
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const firstDate = groupedDates[0]!;
            return {
                key,
                label: getLabel(decodeDate(firstDate)),
                firstDate,
                span: groupedDates.length,
            };
        },
    );
}

export function groupDatesByIsoWeek(dates: string[]) {
    return groupDates(
        dates,
        (dateValue) => {
            const { year, week } = getIsoWeek(dateValue);
            return `${year}-${week}`;
        },
        (dateValue) => `W${getIsoWeek(dateValue).week}`,
    );
}

const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'short' });

function groupDatesByMonth(dates: string[]) {
    return groupDates(
        dates,
        (dateValue) => `${dateValue.getFullYear()}-${dateValue.getMonth()}`,
        (dateValue) => monthFormatter.format(dateValue),
    );
}

export type DayBoundary = 'month' | 'week';

// Every day takes an equal share of the width; a narrow track separates weeks and months
const DAY_TRACK = '1fr';
const BOUNDARY_TRACK = 'var(--spacing-sm)';

interface DayTrackGroup extends DateGroup {
    startIndex: number;
    // Offset of the group's first track from the first day track
    trackStart: number;
    // The group's day tracks and the boundary tracks between them
    trackSpan: number;
}

// Grid tracks for a run of days, with a boundary track where a new week or month starts
// NOTE: dates must be sorted
export function getDayTracks(dates: string[]) {
    const boundaries: Record<string, DayBoundary> = {};
    groupDatesByIsoWeek(dates).slice(1).forEach((week) => {
        boundaries[week.firstDate] = 'week';
    });
    groupDatesByMonth(dates).slice(1).forEach((month) => {
        boundaries[month.firstDate] = 'month';
    });

    const tracks: string[] = [];
    const trackOffsets = dates.map((date) => {
        if (boundaries[date]) {
            tracks.push(BOUNDARY_TRACK);
        }
        tracks.push(DAY_TRACK);
        return tracks.length - 1;
    });

    const toTrackGroups = (groups: DateGroup[]) => {
        let startIndex = 0;
        return groups.map((group): DayTrackGroup => {
            const groupStartIndex = startIndex;
            startIndex += group.span;
            // NOTE: Every group has at least one date
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const trackStart = trackOffsets[groupStartIndex]!;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const trackEnd = trackOffsets[startIndex - 1]!;
            return {
                ...group,
                startIndex: groupStartIndex,
                trackStart,
                trackSpan: trackEnd - trackStart + 1,
            };
        });
    };

    return {
        boundaries,
        tracks,
        trackOffsets,
        months: toTrackGroups(groupDatesByMonth(dates)),
        weeks: toTrackGroups(groupDatesByIsoWeek(dates)),
    };
}
