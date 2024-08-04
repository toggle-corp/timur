import {
    caseInsensitiveSubmatch,
    compareStringSearch,
    encodeDate,
    isFalsyString,
} from '@togglecorp/fujs';

export function getNewId() {
    return Math.round(Math.random() * 9999999);
}

export function rankedSearchOnList<T>(
    list: T[],
    searchString: string | undefined,
    labelSelector: (item: T) => string,
) {
    if (isFalsyString(searchString)) {
        return list;
    }

    return list
        .filter((option) => caseInsensitiveSubmatch(labelSelector(option), searchString))
        .sort((a, b) => compareStringSearch(
            labelSelector(a),
            labelSelector(b),
            searchString,
        ));
}

export function getDurationString(totalHours: number) {
    // NOTE: We are using round to remedy cases like (2039 / 60 * 60)
    const totalMinutes = Math.round(totalHours * 60);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function validateHhmm(hourStr: string, minuteStr: string) {
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    if (minute > 59) {
        return undefined;
    }
    const totalHours = (hour + (minute / 60));
    if (totalHours > 24) {
        return undefined;
    }
    return totalHours;
}

export function getDurationNumber(value: string | undefined) {
    if (!value) {
        return undefined;
    }
    if (value.match(/^\d{1,2}:\d\d$/)) {
        const [hourStr, minuteStr] = value.split(':');
        return validateHhmm(hourStr, minuteStr) ?? null;
    }
    if (value.match(/^\d\d\d\d$/)) {
        const hourStr = value.substring(0, 2);
        const minuteStr = value.substring(2, 4);
        return validateHhmm(hourStr, minuteStr) ?? null;
    }
    if (value.match(/^\d\d\d$/)) {
        const hourStr = value.substring(0, 1);
        const minuteStr = value.substring(1, 3);
        return validateHhmm(hourStr, minuteStr) ?? null;
    }
    return null;
}

export function addDays(dateStr: string, numDays: number) {
    // FIXME: we should always append time when converting date from string
    const date = new Date(dateStr);
    date.setDate(date.getDate() + numDays);

    return encodeDate(date);
}
