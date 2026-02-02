import {
    useEffect,
    useState,
} from 'react';
import { encodeDate } from '@togglecorp/fujs';

import DateContext from '#contexts/date';

interface BaseProps {
    children: React.ReactNode;
}

function DateProvider(props: BaseProps) {
    const { children } = props;

    const [date, setDate] = useState(() => {
        const today = new Date();
        return {
            fullDate: encodeDate(today),
            year: today.getFullYear(),
            month: today.getMonth(),
            day: today.getDate(),
        };
    });

    useEffect(
        () => {
            const timeout = window.setInterval(
                () => {
                    setDate((oldValue) => {
                        const today = new Date();
                        const newDateString = encodeDate(today);
                        if (oldValue.fullDate === newDateString) {
                            return oldValue;
                        }
                        return {
                            fullDate: newDateString,
                            year: today.getFullYear(),
                            month: today.getMonth(),
                            day: today.getDate(),
                        };
                    });
                },
                2000,
            );
            return () => {
                window.clearInterval(timeout);
            };
        },
        [],
    );

    return (
        <DateContext.Provider value={date}>
            {children}
        </DateContext.Provider>
    );
}

export default DateProvider;
