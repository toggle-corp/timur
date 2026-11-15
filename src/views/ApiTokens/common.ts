import { decodeDate } from '@togglecorp/fujs';

import { type DateLike } from '#utils/temporal';

export const TOKEN_PREFIX = 'tc_timur_';
export const MAX_ACTIVE_TOKENS = 10;

const dateFormatter = new Intl.DateTimeFormat(
    [],
    {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    },
);

const timestampFormatter = new Intl.DateTimeFormat(
    [],
    {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    },
);

export function formatDate(value: DateLike) {
    return dateFormatter.format(new Date(value));
}

export function formatTimestamp(value: DateLike) {
    return timestampFormatter.format(new Date(value));
}

// End of the given local date (YYYY-MM-DD), when a token picked for that date expires
export function getEndOfDay(date: string) {
    const value = decodeDate(date);
    value.setHours(23, 59, 59, 0);
    return value.toISOString();
}
