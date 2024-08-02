import {
    caseInsensitiveSubmatch,
    compareStringSearch,
    isFalsyString,
} from '@togglecorp/fujs';

export function getNewId() {
    return Math.round(Math.random() * 9999999);
}

export function numericIdSelector({ id }: { id: number }) {
    return id;
}

export function stringTitleSelector({ title }: { title: string }) {
    return title;
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
