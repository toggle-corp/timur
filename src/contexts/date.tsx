import { createContext } from 'react';
import { encodeDate } from '@togglecorp/fujs';

interface DateContextType {
    fullDate: string,
    year: number,
    month: number,
    day: number,
}

const today = new Date();

const DateContext = createContext<DateContextType>({
    fullDate: encodeDate(today),
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate(),
});

export default DateContext;
