import {
    caseInsensitiveSubmatch,
    compareStringSearch,
    encodeDate,
    isDefined,
    isFalsyString,
    isNotDefined,
    listToGroupList,
    listToMap,
    mapToList,
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
}
export function getWindowSize(): Size {
    return {
        width: window.innerWidth,
        height: window.innerHeight,
    };
}

function squash<T extends object>(items: T[]): T | undefined {
    if (items.length <= 1) {
        return items[0];
    }
    return items.reduce(
        (acc, val) => ({
            ...acc,
            ...val,
        }),
        items[0],
    );
}

export function mergeList<T extends object>(
    foo: T[],
    bar: T[],
    keySelector: (item: T) => string,
) {
    const items = [...foo, ...bar];
    const squashedItemsMapping = listToGroupList(
        items,
        (item) => keySelector(item),
        (item) => item,
        (groupedItems) => squash(groupedItems),
    );
    return mapToList(squashedItemsMapping).filter(isDefined);
}

export function getNewId(): string {
    return ulid();
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
        return Number(value);
    }
    // hh:mm
    // hh:m
    // h:mm
    // h:m
    // :mm
    // :m
    if (value.match(/^\d{0,2}:\d{1,2}$/)) {
        const [hourStr, minuteStr] = value.split(':');
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
    // FIXME: we should always append time when converting date from string
    const date = new Date(dateStr);
    date.setDate(date.getDate() + numDays);

    return encodeDate(date);
}

export function getChangedItems<T>(
    initialItems: T[] | undefined,
    finalItems: T[] | undefined,
    keySelector: (item: T) => string,
) {
    const initialKeysMap = listToMap(initialItems ?? [], keySelector);
    const finalKeysMap = listToMap(finalItems ?? [], keySelector);

    const addedKeys = Object.keys(finalKeysMap).filter(
        (key) => !initialKeysMap[key],
    );
    const removedKeys = Object.keys(initialKeysMap).filter(
        (key) => !finalKeysMap[key],
    );
    const updatedKeys = Object.keys(initialKeysMap).filter(
        (key) => {
            if (isNotDefined(finalKeysMap[key])) {
                return false;
            }

            const initialObj = initialKeysMap[key];
            const finalObj = finalKeysMap[key];

            const initialJson = JSON.stringify(
                initialObj,
                initialObj ? Object.keys(initialObj).sort() : undefined,
            );
            const finalJson = JSON.stringify(
                finalObj,
                finalObj ? Object.keys(finalObj).sort() : undefined,
            );

            return initialJson !== finalJson;
        },
    );

    return {
        addedItems: addedKeys.map((key) => finalKeysMap[key]),
        removedItems: removedKeys.map((key) => initialKeysMap[key]),
        updatedItems: updatedKeys.map((key) => finalKeysMap[key]),
    };
}

export function fuzzySearch<ItemType = string>(
    rows: ReadonlyArray<ItemType>,
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
    const newList = [...list];
    newList.sort(
        (a, b) => {
            let sortResult = 0;

            for (let i = 0; i < attributes.length; i += 1) {
                const currentSortResult = sortFn(
                    a,
                    b,
                    attributes[i],
                );

                if (currentSortResult !== 0) {
                    sortResult = currentSortResult;
                    break;
                }
            }

            return sortResult;
        },
    );

    return newList;
}

type GroupedItem<LIST_ITEM, ATTRIBUTE> = {
    key: string;
    type: 'heading';
    value: LIST_ITEM;
    attribute: ATTRIBUTE;
    level: number;
} | {
    type: 'list-item';
    value: LIST_ITEM;
    level: number;
};

// NOTE: the list must be sorted before grouping
export function groupListByAttributes<LIST_ITEM, ATTRIBUTE>(
    list: LIST_ITEM[],
    attributes: ATTRIBUTE[],
    compareItemAttributes: (a: LIST_ITEM, b: LIST_ITEM, attribute: ATTRIBUTE) => boolean,
): GroupedItem<LIST_ITEM, ATTRIBUTE>[] {
    if (isNotDefined(list) || list.length === 0) {
        return [];
    }

    const groupedItems = list.flatMap((listItem, listIndex) => {
        if (listIndex === 0) {
            const headings = attributes.map((attribute, i) => ({
                type: 'heading' as const,
                value: listItem,
                attribute,
                level: i,
                key: `heading-${listIndex}-${i}`,
            }));

            return [
                ...headings,
                {
                    type: 'list-item' as const,
                    value: listItem,
                    level: attributes.length,
                },
            ];
        }

        const prevListItem = list[listIndex - 1];
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

            return {
                type: 'heading' as const,
                value: listItem,
                attribute,
                level: i,
                key: `heading-${listIndex}-${i}`,
            };
        }).filter(isDefined);

        return [
            ...headings,
            {
                type: 'list-item' as const,
                value: listItem,
                level: attributes.length,
            },
        ];
    });

    return groupedItems;
}
