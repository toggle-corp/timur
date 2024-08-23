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
    DateLike,
    formatRelativeDateToString,
    RelativeDate,
    toRelativeDate,
} from '#utils/temporal';

function useFormattedRelativeDate(dateLike: DateLike) {
    const [relativeDate, setRelativeDate] = useState<RelativeDate | undefined>(
        () => (isDefined(dateLike)
            ? toRelativeDate(dateLike)
            : undefined)
        ,
    );

    const updateTimeoutRef = useRef<number>();

    const update = useCallback(() => {
        if (isDefined(dateLike)) {
            setRelativeDate(toRelativeDate(dateLike));
        }
    }, [dateLike]);

    useEffect(update, [update]);

    useEffect(() => {
        window.clearTimeout(updateTimeoutRef.current);
        if (isNotDefined(relativeDate)) {
            return;
        }

        const timeoutDuration = 1000 * 15;

        updateTimeoutRef.current = window.setTimeout(update, timeoutDuration);
    }, [relativeDate, update]);

    return formatRelativeDateToString(relativeDate);
}

export default useFormattedRelativeDate;
