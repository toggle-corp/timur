import {
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    getFromStorage,
    setToStorage,
} from '#utils/localStorage';

function useLocalStorage<T>(
    key: string,
    defaultValue: T,
    debounce = 500,
) {
    const [val, setVal] = useState<T>(
        () => (getFromStorage<T>(key) ?? defaultValue),
    );

    const syncTimeoutRef = useRef<number | undefined>();

    useEffect(() => {
        window.clearTimeout(syncTimeoutRef.current);

        syncTimeoutRef.current = window.setTimeout(
            () => {
                setToStorage(key, val);
            },
            debounce,
        );
    }, [val, key, debounce]);

    return [val, setVal] as const;
}

export default useLocalStorage;
