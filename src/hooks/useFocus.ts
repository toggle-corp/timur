import {
    useCallback,
    useContext,
    useEffect,
    useRef,
} from 'react';

import FocusContext from '#contexts/focus';

export function useFocusManager() {
    const data = useRef<{
        [key: string]: React.RefObject<HTMLElement>
    }>({});

    const focus = useCallback(
        (key: string) => {
            const element = data.current[key];
            if (element && element.current) {
                element.current.focus();
            }
        },
        [],
    );

    const register = useCallback(
        (key: string, inputRef: React.RefObject<HTMLElement>) => {
            data.current[key] = inputRef;
        },
        [],
    );

    const unregister = useCallback(
        (key: string) => {
            delete data.current[key];
        },
        [],
    );

    return {
        focus,
        register,
        unregister,
    };
}

export function useFocusClient(key: string) {
    const { register, unregister } = useContext(FocusContext);

    const inputRef = useRef<HTMLElement>(null);
    useEffect(
        () => {
            register(key, inputRef);
            return () => {
                unregister(key);
            };
        },
        [key, register, unregister],
    );

    return inputRef;
}
