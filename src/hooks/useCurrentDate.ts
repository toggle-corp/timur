import {
    useEffect,
    useState,
} from 'react';

const DEFAULT_INTERVAL_MS = 5000;

// Current date, refreshed every `intervalMs`
function useCurrentDate(intervalMs = DEFAULT_INTERVAL_MS) {
    const [dateStr, setDateStr] = useState(() => {
        const date = new Date();
        return date;
    });

    useEffect(
        () => {
            const timeout = window.setInterval(
                () => {
                    const date = new Date();
                    setDateStr(date);
                },
                intervalMs,
            );
            return () => {
                window.clearInterval(timeout);
            };
        },
        [intervalMs],
    );
    return dateStr;
}

export default useCurrentDate;
