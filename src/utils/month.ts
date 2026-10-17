import { encodeDate } from '@togglecorp/fujs';

import { addDays } from '#utils/common';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function getMonth(date: string) {
    return date.slice(0, 7);
}

export function addMonths(month: string, count: number) {
    const [year = 0, monthNumber = 1] = month.split('-').map(Number);
    return getMonth(encodeDate(new Date(year, monthNumber - 1 + count, 1)));
}

// Invalid and future months fall back to the current month
export function parseMonth(value: string | undefined, today: string) {
    const currentMonth = getMonth(today);
    if (!value || !MONTH_PATTERN.test(value) || value > currentMonth) {
        return currentMonth;
    }
    return value;
}

export function getMonthDates(month: string) {
    return {
        startDate: `${month}-01`,
        endDate: addDays(`${addMonths(month, 1)}-01`, -1),
    };
}

const MONTH_SEARCH_PARAM = 'month';

// The current month is the default, so it stays out of the URL
export function getMonthSearch(month: string, currentMonth: string) {
    if (month === currentMonth) {
        return undefined;
    }
    return new URLSearchParams({ [MONTH_SEARCH_PARAM]: month }).toString();
}
