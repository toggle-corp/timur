import {
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    googleLogout,
    useGoogleLogin,
} from '@react-oauth/google';

const STORAGE_KEY = 'timur-google-calendar-token';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

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

interface StoredToken {
    accessToken: string;
    expiresAt: number;
}

function getStoredToken(): StoredToken | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as StoredToken;
    } catch {
        return null;
    }
}

function isTokenValid(token: StoredToken | null): token is StoredToken {
    if (!token) return false;
    return Date.now() < token.expiresAt - 60_000;
}

function useGoogleCalendar() {
    const clientId = import.meta.env.APP_GOOGLE_OAUTH_CLIENT_ID as string | undefined;

    const [storedToken, setStoredToken] = useState<StoredToken | null>(() => getStoredToken());

    const isConnected = isTokenValid(storedToken);

    // Clear token when it expires
    useEffect(() => {
        if (!storedToken) return undefined;
        const msUntilExpiry = storedToken.expiresAt - Date.now();
        if (msUntilExpiry <= 0) {
            setStoredToken(null);
            return undefined;
        }
        const timeout = window.setTimeout(() => setStoredToken(null), msUntilExpiry);
        return () => window.clearTimeout(timeout);
    }, [storedToken]);

    const saveToken = useCallback((accessToken: string, expiresIn: number) => {
        const token: StoredToken = {
            accessToken,
            expiresAt: Date.now() + expiresIn * 1000,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(token));
        setStoredToken(token);
    }, []);

    const clearToken = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setStoredToken(null);
    }, []);

    const login = useGoogleLogin({
        scope: CALENDAR_SCOPE,
        onSuccess: (response) => {
            saveToken(response.access_token, response.expires_in);
        },
        onError: () => {
            clearToken();
        },
    });

    const connect = useCallback(() => {
        login();
    }, [login]);

    const disconnect = useCallback(() => {
        googleLogout();
        clearToken();
    }, [clearToken]);

    const fetchEventsForDateRange = useCallback(async (
        startDate: string,
        endDate: string,
        options?: { fullDayOnly?: boolean },
    ): Promise<GoogleCalendarEvent[]> => {
        if (!isConnected || !storedToken) return [];

        const rangeStart = new Date(startDate);
        rangeStart.setHours(0, 0, 0, 0);

        const rangeEnd = new Date(endDate);
        rangeEnd.setHours(23, 59, 59, 999);

        const params = new URLSearchParams({
            timeMin: rangeStart.toISOString(),
            timeMax: rangeEnd.toISOString(),
            singleEvents: 'true',
            orderBy: 'startTime',
        });

        const response = await fetch(
            `${CALENDAR_API_BASE}/calendars/primary/events?${params}`,
            { headers: { Authorization: `Bearer ${storedToken.accessToken}` } },
        );

        if (!response.ok) {
            if (response.status === 401) clearToken();
            return [];
        }

        const data = await response.json() as { items?: GoogleCalendarEvent[] };
        const items = data.items ?? [];
        if (options?.fullDayOnly) {
            return items.filter((event) => !!event.start.date && !event.start.dateTime);
        }
        return items;
    }, [isConnected, storedToken, clearToken]);

    const fetchEvents = useCallback(
        (date: string, options?: { fullDayOnly?: boolean }) => (
            fetchEventsForDateRange(date, date, options)
        ),
        [fetchEventsForDateRange],
    );

    return {
        isAvailable: !!clientId,
        isConnected,
        expiresAt: storedToken?.expiresAt,
        connect,
        disconnect,
        fetchEvents,
        fetchEventsForDateRange,
    };
}

export default useGoogleCalendar;
