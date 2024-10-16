import {
    useEffect,
    useState,
} from 'react';

const dateTimeFormatter = new Intl.DateTimeFormat(
    [],
    {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        // second: 'numeric',
        hour12: true,
    },
);

function formatTime(date: Date) {
    return dateTimeFormatter.format(date);
}

function Clock() {
    const [dateStr, setDateStr] = useState(() => {
        const date = new Date();
        return formatTime(date);
    });
    useEffect(
        () => {
            const timeout = window.setInterval(
                () => {
                    const date = new Date();
                    const dateAsString = formatTime(date);
                    setDateStr(dateAsString);
                },
                500,
            );
            return () => {
                window.clearInterval(timeout);
            };
        },
        [],
    );
    return (
        <div>
            {dateStr}
        </div>
    );
}

export default Clock;
