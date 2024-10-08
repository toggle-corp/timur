import {
    isDefined,
    isList,
    isObject,
} from '@togglecorp/fujs';

// eslint-disable-next-line import/prefer-default-export
export function removeNull(
    data,
    ignoreKeys = ['__typename'],
) {
    if (data === null || data === undefined) {
        return undefined;
    }
    if (isList(data)) {
        return data
            .map((item) => removeNull(item, ignoreKeys))
            .filter(isDefined);
    }
    if (isObject(data)) {
        return Object.keys(data).reduce(
            (acc, key) => {
                if (ignoreKeys && ignoreKeys.includes(key)) {
                    return acc;
                }

                const val = data[key];
                const newEntry = removeNull(val, ignoreKeys);
                return {
                    ...acc,
                    [key]: isDefined(newEntry) ? newEntry : undefined,
                };
            },
            {},
        );
    }
    return data;
}
