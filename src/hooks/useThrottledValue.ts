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

    const timeoutRef = useRef<number>();

    useEffect(
        () => {
            latestValue.current = input;
        },
        [input],
    );

    useEffect(() => {
        if (isDefined(timeoutRef.current)) {
            return;
        }

        timeoutRef.current = window.setTimeout(
            () => {
                setThrottledValue(latestValue.current);

                timeoutRef.current = undefined;
            },
            throttleTime,
        );
    }, [input, throttleTime]);

    useEffect(() => () => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
        }
    }, []);

    return throttleValue;
}

export default useThrottledValue;
