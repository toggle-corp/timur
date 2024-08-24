import { isNotDefined } from '@togglecorp/fujs';

interface RelativeTime {
    direction: 'past' | 'present' | 'future',
    resolution: 'second' | 'minute' | 'hour' | 'day';
    value: number;
}

export interface RelativeDate {
    direction: 'past' | 'present' | 'future',
    resolution: 'day' | 'week' | 'month' | 'year';
    value: number;
}

export type DateLike = string | number | Date;

export function incrementDate(date: Date, days = 1) {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
}

export function incrementMonth(date: Date, months = 1) {
    const newDate = new Date(date);
    newDate.setDate(1);
    newDate.setMonth(date.getMonth() + months);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
}

export function getNumberOfDays(start: Date, end: Date) {
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

export function getNumberOfMonths(start: Date, end: Date) {
    const monthDiff = Math.abs(
        ((12 * end.getFullYear()) + end.getMonth())
        - ((12 * start.getFullYear()) + start.getMonth()),
    );
    return monthDiff;
}

export function getTemporalDiff(min: DateLike, max: DateLike) {
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

export function toRelativeTime(timestamp: number): RelativeTime {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff === 0) {
        return {
            direction: 'present',
            resolution: 'second',
            value: 0,
        };
    }

    const direction = diff < 0 ? 'future' : 'past';
    const absDiff = Math.abs(diff);

    const seconds = Math.floor((absDiff / 1000) % 60);
    const minutes = Math.floor((absDiff / (1000 * 60)) % 60);
    const hours = Math.floor((absDiff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

    if (days > 0) {
        return {
            direction,
            resolution: 'day',
            value: days,
        };
    }

    if (hours > 0) {
        return {
            direction,
            resolution: 'hour',
            value: hours,
        };
    }

    if (minutes > 0) {
        return {
            direction,
            resolution: 'minute',
            value: minutes,
        };
    }

    return {
        direction,
        resolution: 'second',
        value: Math.max(1, seconds),
    };
}

export function formatRelativeTimeToString(relativeTime: RelativeTime) {
    const {
        direction,
        resolution,
        value,
    } = relativeTime;

    if (direction === 'present') {
        return 'now';
    }

    if (direction === 'past') {
        return value === 1 ? `A ${resolution} ago` : `${value} ${resolution}s ago`;
    }

    return value === 1 ? `In a ${resolution}` : `In ${value} ${resolution}s`;
}
