import {
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

import LocalStorageContext, { StoredValue } from '#contexts/localStorage';
import { isCallable } from '#utils/common';
import { getFromStorage } from '#utils/localStorage';

import useDebouncedValue from './useDebouncedValue';

function useLocalStorage<T>(
    key: string,
    defaultValue: T,
    debounce = 200,
) {
    const [value, setValue] = useState<StoredValue<T>>(
        () => {
            const fromStorage = getFromStorage<T>(key);

            return {
                timestamp: new Date().getTime(),
                value: fromStorage ?? defaultValue,
            };
        },
    );

    const { storageState, setStorageState } = useContext(LocalStorageContext);
    const debouncedValue = useDebouncedValue(value, debounce);

    useEffect(() => {
        if (!storageState[key]) {
            return;
        }

        if (storageState[key].timestamp > value.timestamp) {
            setValue(storageState[key] as StoredValue<T>);
        }
    }, [storageState, key, value]);

    useEffect(() => {
        setStorageState((oldStorageValue) => ({
            ...oldStorageValue,
            [key]: debouncedValue,
        }));
    }, [debouncedValue, key, setStorageState]);

    const setValueSafe = useCallback((newValue: T | ((v: T) => T)) => {
        setValue((oldValue) => {
            const resolvedValue = isCallable(newValue)
                ? newValue(oldValue.value)
                : newValue;

            return {
                timestamp: new Date().getTime(),
                value: resolvedValue,
            } satisfies StoredValue<T>;
        });
    }, []);

    return [value.value, setValueSafe] as const;
}

export default useLocalStorage;
