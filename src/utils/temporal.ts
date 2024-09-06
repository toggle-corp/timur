import { isNotDefined } from '@togglecorp/fujs';

export interface RelativeDate {
    direction: 'past' | 'present' | 'future',
    resolution: 'day' | 'week' | 'month' | 'year';
    value: number;
}

export type DateLike = string | number | Date;

function incrementDate(date: Date, days = 1) {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
}

function getNumberOfDays(start: Date, end: Date) {
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    let numDays = 0;
    for (let i = startDate; i < endDate; i = incrementDate(i)) {
        numDays += 1;
    }

    return numDays;
}

function getNumberOfMonths(start: Date, end: Date) {
    const monthDiff = Math.abs(
        ((12 * end.getFullYear()) + end.getMonth())
        - ((12 * start.getFullYear()) + start.getMonth()),
    );
    return monthDiff;
}

function getTemporalDiff(min: DateLike, max: DateLike) {
    const minDate = new Date(min);
    const maxDate = new Date(max);

    const yearsDiff = maxDate.getFullYear() - minDate.getFullYear();
    const monthsDiff = getNumberOfMonths(minDate, maxDate);
    const daysDiff = getNumberOfDays(minDate, maxDate);

    return {
        year: yearsDiff,
        month: monthsDiff,
        day: daysDiff,
    };
}

export function toRelativeDate(dateLike: DateLike): RelativeDate | undefined {
    const today = new Date();
    const date = new Date(dateLike);

    if (Number.isNaN(date.getTime())) {
        return undefined;
    }

    const timestampDiff = date.getTime() - today.getTime();
    const startDate = timestampDiff > 0 ? today : date;
    const endDate = timestampDiff > 0 ? date : today;

    const temporalDiff = getTemporalDiff(startDate, endDate);
    const direction = timestampDiff > 0 ? 'future' : 'past';

    if (temporalDiff.day === 0) {
        return {
            direction: 'present',
            resolution: 'day',
            value: 0,
        };
    }

    if (temporalDiff.day < 7) {
        return {
            direction,
            resolution: 'day',
            value: temporalDiff.day,
        };
    }

    if (temporalDiff.day >= 7 && temporalDiff.day <= 21) {
        const numWeeks = Math.round(temporalDiff.day / 7);

        return {
            direction,
            resolution: 'week',
            value: numWeeks,
        };
    }

    if (temporalDiff.day > 21 && temporalDiff.month > 0 && temporalDiff.month < 10) {
        return {
            direction,
            resolution: 'month',
            value: temporalDiff.month,
        };
    }

    if (temporalDiff.day > 200 && temporalDiff.year > 0) {
        return {
            direction,
            resolution: 'year',
            value: temporalDiff.year,
        };
    }

    return {
        direction: 'present',
        resolution: 'day',
        value: 0,
    };
}

export function formatRelativeDateToString(relativeDate: RelativeDate | undefined) {
    if (isNotDefined(relativeDate)) {
        return '--';
    }

    const {
        direction,
        resolution,
        value,
    } = relativeDate;

    if (direction === 'present') {
        return 'Today';
    }

    if (direction === 'past') {
        if (resolution === 'day' && value === 1) {
            return 'Yesterday';
        }

        return value === 1 ? `Last ${resolution}` : `${value} ${resolution}s ago`;
    }

    if (resolution === 'day' && value === 1) {
        return 'Tomorrow';
    }

    return value === 1 ? `In a ${resolution}` : `In ${value} ${resolution}s`;
}
