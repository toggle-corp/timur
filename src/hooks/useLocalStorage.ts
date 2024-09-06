import {
    useCallback,
    useContext,
    useEffect,
    useMemo,
} from 'react';
import { isDefined } from '@togglecorp/fujs';

import LocalStorageContext, { StorageState } from '#contexts/localStorage';
import {
    isCallable,
    putNull,
    putUndefined,
} from '#utils/common';
import {
    getFromStorage,
    setToStorage,
} from '#utils/localStorage';

function useLocalStorage<K extends keyof StorageState>(key: K) {
    const {
        storageState,
        setStorageState,
    } = useContext(LocalStorageContext);

    type T = StorageState[K];

    const hasReadValue = isDefined(storageState[key].value);

    useEffect(
        () => {
            if (hasReadValue) {
                return;
            }
            const val = getFromStorage<T['value']>(key);
            setStorageState((oldValue) => ({
                ...oldValue,
                [key]: {
                    ...oldValue[key],
                    value: val,
                },
            }));
        },
        [key, hasReadValue, setStorageState],
    );

    const setValue: React.Dispatch<React.SetStateAction<NonNullable<T['value']>>> = useCallback(
        (newValue) => {
            setStorageState((oldValue) => {
                const oldValueValue = oldValue[key].value;
                const oldValueDefaultValue = oldValue[key].defaultValue;

                const resolvedValue = isCallable(newValue)
                    ? newValue(oldValueValue ?? oldValueDefaultValue)
                    : newValue;

                setToStorage(key, putNull(resolvedValue));

                return {
                    ...oldValue,
                    [key]: {
                        ...oldValue[key],
                        value: resolvedValue,
                    },
                } satisfies StorageState;
            });
        },
        [key, setStorageState],
    );

    const { value } = storageState[key];
    const { defaultValue } = storageState[key];

    const finalValue = useMemo(
        () => putUndefined({
            ...defaultValue,
            ...value,
        }),
        [defaultValue, value],
    );

    return [
        finalValue,
        setValue,
    ] as const;
}

export default useLocalStorage;
