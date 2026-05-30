import { createContext } from 'react';

export interface GoogleCalendarEvent {
    id: string;
    summary?: string;
    description?: string;
    location?: string;
    status: string;
    htmlLink?: string;
    start: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
}

export interface GoogleCalendarContextValue {
    isAvailable: boolean;
    isConnected: boolean;
    expiresAt: number | undefined;
    connect: () => void;
    disconnect: () => void;
    fetchEvents: (
        date: string,
        options?: { fullDayOnly?: boolean },
    ) => Promise<GoogleCalendarEvent[]>;
    fetchEventsForDateRange: (
        startDate: string,
        endDate: string,
        options?: { fullDayOnly?: boolean },
    ) => Promise<GoogleCalendarEvent[]>;
}

const GoogleCalendarContext = createContext<GoogleCalendarContextValue>({
    isAvailable: false,
    isConnected: false,
    expiresAt: undefined,
    connect: () => {
        // eslint-disable-next-line no-console
        console.warn('GoogleCalendarContext::connect called without provider');
    },
    disconnect: () => {
        // eslint-disable-next-line no-console
        console.warn('GoogleCalendarContext::disconnect called without provider');
    },
    fetchEvents: () => Promise.resolve([]),
    fetchEventsForDateRange: () => Promise.resolve([]),
});

export default GoogleCalendarContext;
