import { isNotDefined } from '@togglecorp/fujs';

export function getFromStorage<T>(key: string) {
    const val = localStorage.getItem(key);
    return val === null || val === undefined ? undefined : JSON.parse(val) as T;
}

export function removeFromStorage(key: string) {
    localStorage.removeItem(key);
}

export function setToStorage(key: string, value: unknown) {
    if (isNotDefined(value)) {
        localStorage.clearItem(key);
    }
    localStorage.setItem(key, JSON.stringify(value));
}
