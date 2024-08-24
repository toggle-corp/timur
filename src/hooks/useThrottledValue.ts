import {
    useEffect,
    useRef,
    useState,
} from 'react';
import { isDefined } from '@togglecorp/fujs';

function useThrottledValue<T>(
    input: T,
    throttleTime = 200,
): T {
    const [throttleValue, setThrottledValue] = useState(
        () => input,
    );

    const latestValue = useRef(input);

    const idleCallbackRef = useRef<number>();

    useEffect(
        () => {
            latestValue.current = input;
        },
        [input],
    );

    useEffect(() => {
        if (isDefined(idleCallbackRef.current)) {
            return;
        }

        idleCallbackRef.current = window.requestIdleCallback(
            () => {
                setThrottledValue(latestValue.current);

                idleCallbackRef.current = undefined;
            },
            { timeout: throttleTime },
        );
    }, [input, throttleTime]);

    useEffect(() => () => {
        if (idleCallbackRef.current) {
            window.cancelIdleCallback(idleCallbackRef.current);
            idleCallbackRef.current = undefined;
        }
    }, []);

    return throttleValue;
}

export default useThrottledValue;
