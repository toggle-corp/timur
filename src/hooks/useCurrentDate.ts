import {
    useEffect,
    useState,
} from 'react';

function useCurrentDate() {
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
                5000,
            );
            return () => {
                window.clearInterval(timeout);
            };
        },
        [],
    );
    return dateStr;
}

export default useCurrentDate;
