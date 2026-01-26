import {
    encodeDate,
    isDefined,
    isFalsyString,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    matchSorter,
    type MatchSorterOptions,
} from 'match-sorter';
import { ulid } from 'ulidx';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Func = (...args:any[]) => any;
export function isCallable<T, X extends Func>(value: T | X): value is X {
    return typeof value === 'function';
}

export interface Size {
    width: number;
    height: number;
    screen: 'desktop' | 'mobile';
}
export function getWindowSize(): Size {
    return {
        width: window.innerWidth,
        height: window.innerHeight,
        screen: window.innerWidth >= 900
            ? 'desktop'
            : 'mobile',
    };
}

export function getNewId(): string {
    return ulid();
}

export function getDurationString(totalMinutes: number) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function validateHhmm(hourStr: string, minuteStr: string) {
    const hour = Number(hourStr === '' ? '0' : hourStr);
    const minute = Number(minuteStr);
    if (minute > 59) {
        return undefined;
    }
    const totalMinutes = hour * 60 + minute;
    if (totalMinutes > 24 * 60) {
        return undefined;
    }
    return totalMinutes;
}

export function getDurationNumber(value: string | undefined) {
    if (!value) {
        return undefined;
    }
    // decimal
    if (value.match(/^\d{0,2}\.\d{1,2}$/)) {
        return Math.round(Number(value) * 60);
    }
    // hh:mm
    // hh:m
    // h:mm
    // h:m
    // :mm
    // :m
    if (value.match(/^\d{0,2}:\d{1,2}$/)) {
        const [hourStr, minuteStr] = value.split(':');
        if (isNotDefined(hourStr) || isNotDefined(minuteStr)) {
            return null;
        }
        return validateHhmm(hourStr, minuteStr) ?? null;
    }
    // hhmm
    if (value.match(/^\d{4}$/)) {
        const hourStr = value.substring(0, 2);
        const minuteStr = value.substring(2, 4);
        return validateHhmm(hourStr, minuteStr) ?? null;
    }
    // hmm
    if (value.match(/^\d{3}$/)) {
        const hourStr = value.substring(0, 1);
        const minuteStr = value.substring(1, 3);
        return validateHhmm(hourStr, minuteStr) ?? null;
    }
    // hh
    // h
    if (value.match(/^\d{1,2}$/)) {
        const hourStr = value;
        const minuteStr = '0';
        return validateHhmm(hourStr, minuteStr) ?? null;
    }
    return null;
}

export function addDays(dateStr: string, numDays: number) {
    const date = new Date(`${dateStr}T00:00:00`);
    date.setDate(date.getDate() + numDays);
    return encodeDate(date);
}

export function fuzzySearch<ItemType = string>(
    rows: ItemType[],
    filterValue: string,
    options?: MatchSorterOptions<ItemType>,
) {
    if (!filterValue || filterValue.length <= 0) {
        return rows;
    }

    const terms = filterValue.split(' ');
    if (!terms) {
        return rows;
    }

    // reduceRight will mean sorting is done by score for the _first_ entered word.
    return terms.reduceRight(
        (results, term) => matchSorter(results, term, options),
        rows,
    );
}

export function sortByAttributes<LIST_ITEM, ATTRIBUTE>(
    list: LIST_ITEM[],
    attributes: ATTRIBUTE[],
    sortFn: (a: LIST_ITEM, b: LIST_ITEM, attr: ATTRIBUTE) => number,
): LIST_ITEM[] {
    if (attributes.length <= 0) {
        return list;
    }

    const newList = [...list];
    newList.sort(
        (a, b) => {
            for (let i = 0; i < attributes.length; i += 1) {
                const currentSortResult = sortFn(
                    a,
                    b,
                    // NOTE: This should be safe as we are iterating over atttributes
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    attributes[i]!,
                );

                if (currentSortResult !== 0) {
                    return currentSortResult;
                }
            }
            return 0;
        },
    );

    return newList;
}

type GroupedItem<LIST_ITEM, ATTRIBUTE> = {
    groupKey: string;
    type: 'heading';
    value: LIST_ITEM;
    attribute: ATTRIBUTE;
    level: number;
} | {
    itemKey: string;
    type: 'list-item';
    value: LIST_ITEM;
    level: number;
};

// NOTE: the list must be sorted before grouping
export function groupListByAttributes<LIST_ITEM, ATTRIBUTE>(
    list: LIST_ITEM[],
    attributes: ATTRIBUTE[],
    compareItemAttributes: (a: LIST_ITEM, b: LIST_ITEM, attribute: ATTRIBUTE) => boolean,
    getGroupKey: (item: LIST_ITEM, attributes: ATTRIBUTE[]) => string,
): GroupedItem<LIST_ITEM, ATTRIBUTE>[] {
    if (isNotDefined(list) || list.length === 0) {
        return [];
    }

    const groupedItems = list.flatMap((listItem, listIndex) => {
        if (listIndex === 0) {
            const headings = attributes.map((attribute, i) => {
                const groupKey = getGroupKey(listItem, attributes.slice(0, i + 1));
                return {
                    type: 'heading' as const,
                    value: listItem,
                    attribute,
                    level: i,
                    groupKey,
                };
            });

            return [
                ...headings,
                {
                    itemKey: getGroupKey(listItem, attributes),
                    type: 'list-item' as const,
                    value: listItem,
                    level: attributes.length,
                },
            ];
        }

        // NOTE: This will always be in-bounds because we have already checked for listIndex === 0
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const prevListItem = list[listIndex - 1]!;
        const attributeMismatchIndex = attributes.findIndex((attribute) => {
            const hasSameCurrentAttribute = compareItemAttributes(
                listItem,
                prevListItem,
                attribute,
            );

            return !hasSameCurrentAttribute;
        });

        if (attributeMismatchIndex === -1) {
            return [
                {
                    itemKey: getGroupKey(listItem, attributes),
                    type: 'list-item' as const,
                    value: listItem,
                    level: attributes.length,
                },
            ];
        }

        const headings = attributes.map((attribute, i) => {
            if (i < attributeMismatchIndex) {
                return undefined;
            }

            const groupKey = getGroupKey(listItem, attributes.slice(0, i + 1));
            return {
                type: 'heading' as const,
                value: listItem,
                attribute,
                level: i,
                groupKey,
            };
        }).filter(isDefined);

        return [
            ...headings,
            {
                itemKey: getGroupKey(listItem, attributes),
                type: 'list-item' as const,
                value: listItem,
                level: attributes.length,
            },
        ];
    });

    return groupedItems;
}

export type PutNull<T extends object> = {
    [key in keyof T]: T[key] extends undefined ? null : T[key];
}
export function putNull<T extends object>(value: T) {
    type PartialWithNull<Q> = {
      [P in keyof Q]: Q[P] | null;
    };
    const copy: PartialWithNull<T> = { ...value };
    Object.keys(copy).forEach((key) => {
        const safeKey = key as keyof T;
        if (copy[safeKey] === undefined) {
            copy[safeKey] = null;
        }
    });

    return copy as PutNull<T>;
}
type PutUndefined<T extends object> = {
    [key in keyof T]: T[key] extends null ? undefined : T[key];
}
export function putUndefined<T extends object>(value: T) {
    const copy: Partial<T> = { ...value };
    Object.keys(copy).forEach((key) => {
        const safeKey = key as keyof T;
        if (copy[safeKey] === null) {
            copy[safeKey] = undefined;
        }
    });

    return copy as PutUndefined<T>;
}

const dateTimeFormatter = new Intl.DateTimeFormat(
    [],
    {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        // second: 'numeric',
        hour12: true,
    },
);

export function formatDateTime(date: Date) {
    return dateTimeFormatter.format(date);
}

export function rankedSearchOnList<T>(
    list: T[],
    searchString: string | undefined,
    labelSelector: (item: T) => string,
) {
    if (isFalsyString(searchString)) {
        return list;
    }

    return fuzzySearch(
        list,
        searchString,
        {
            keys: [
                labelSelector,
            ],
        },
    );
}
