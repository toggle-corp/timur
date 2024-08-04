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
    const focusRequest = useRef<string | undefined>();

    const focus = useCallback(
        (key: string) => {
            const element = data.current[key];
            if (element && element.current) {
                element.current.focus();
                // If we have a dialog, we cannot focus so we are at least
                // scrolling the content into view
                element.current.scrollIntoView({
                    behavior: 'auto',
                    block: 'center',
                    inline: 'center',
                });
                focusRequest.current = undefined;
            } else {
                focusRequest.current = key;
            }
        },
        [],
    );

    const register = useCallback(
        (key: string, inputRef: React.RefObject<HTMLElement>) => {
            data.current[key] = inputRef;

            // To handle cases where we might call focus before register
            if (focusRequest.current) {
                focus(focusRequest.current);
            }
        },
        [focus],
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

export function useFocusClient<T extends HTMLElement>(key: string) {
    const { register, unregister } = useContext(FocusContext);

    const inputRef = useRef<T>(null);
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
