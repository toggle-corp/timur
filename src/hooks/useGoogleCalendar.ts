import { useContext } from 'react';

import GoogleCalendarContext, { type GoogleCalendarEvent } from '#contexts/googleCalendar';

export type { GoogleCalendarEvent };

function useGoogleCalendar() {
    return useContext(GoogleCalendarContext);
}

export default useGoogleCalendar;
