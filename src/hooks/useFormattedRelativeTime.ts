import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import {
    formatRelativeTimeToString,
    RelativeTime,
    toRelativeTime,
} from '#utils/temporal';

function useFormattedRelativeTime(timestamp: number | undefined) {
    const [relativeTime, setRelativeTime] = useState<RelativeTime | undefined>(
        () => (isDefined(timestamp) ? toRelativeTime(timestamp) : undefined),
    );

    const updateTimeoutRef = useRef<number>();

    const update = useCallback(() => {
        if (isDefined(timestamp)) {
            setRelativeTime(toRelativeTime(timestamp));
        }
    }, [timestamp]);

    useEffect(update, [update]);

    useEffect(() => {
        window.clearTimeout(updateTimeoutRef.current);
        if (isNotDefined(relativeTime)) {
            return;
        }

        const timeoutDuration = relativeTime.resolution === 'second'
            ? (2000 + (500 * relativeTime.value))
            : (1000 * 60);

        updateTimeoutRef.current = window.setTimeout(update, timeoutDuration);
    }, [relativeTime, update]);

    return isDefined(relativeTime)
        ? formatRelativeTimeToString(relativeTime)
        : 'never';
}

export default useFormattedRelativeTime;
