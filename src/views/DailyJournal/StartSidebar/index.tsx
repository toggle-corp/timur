import {
    Suspense,
    useContext,
    useDeferredValue,
    useMemo,
} from 'react';
import {
    RiSettingsLine,
    RiTerminalBoxLine,
} from 'react-icons/ri';
import { useQueryClient } from '@tanstack/react-query';
import {
    gql,
    useQuery,
} from 'urql';

import Button from '#components/Button';
import Link from '#components/Link';
import MonthlyCalendar from '#components/MonthlyCalendar';
import DateContext from '#contexts/date';
import {
    type DayEventsAndDeadlinesQuery,
    type DayEventsAndDeadlinesQueryVariables,
    type JournalLeaveTypeEnum,
    type JournalWorkFromHomeTypeEnum,
} from '#generated/types/graphql';
import useGoogleCalendar, { type GoogleCalendarEvent } from '#hooks/useGoogleCalendar';
import useLocalStorage from '#hooks/useLocalStorage';
import { type WorkItem } from '#utils/types';

import DayEventChipsSection from './DayEventChipsSection';
import GoogleCalendarSection from './GoogleCalendarSection';

import styles from './styles.module.css';

// FIXME: events is paginated
// FIXME: deadlines are only visible for future events
const DAY_EVENTS_AND_DEADLINES = gql`
    query DayEventsAndDeadlines($date: Date!) {
        private {
            id
            events(
                filters: {
                    startDate: { lte: $date }
                    endDate: { gte: $date }
                    types: [HOLIDAY, RETREAT, MISC]
                }
            ) {
                items {
                    id
                    name
                    type
                }
            }
            allDeadlines {
                id
                displayName
                isExternal
                endDate
            }
        }
    }
`;

interface Props {
    selectedDate: string;
    setSelectedDate: (newDate: string) => void;
    onWorkItemCreateFromCalendar: (override: Partial<WorkItem>) => void;
    calendarComponentRef?: React.RefObject<{
        resetView: (year: number, month: number) => void;
    } | null>;
    onShortcutsClick: () => void;
    dayWorkItems: WorkItem[];
    leaveType?: JournalLeaveTypeEnum | null;
    wfhType?: JournalWorkFromHomeTypeEnum | null;
    lastEditedAt: number | null;
}

function StartSidebar(props: Props) {
    const {
        calendarComponentRef,
        selectedDate,
        setSelectedDate,
        onShortcutsClick,
        onWorkItemCreateFromCalendar,
        dayWorkItems,
        leaveType,
        wfhType,
        lastEditedAt,
    } = props;

    const { year, month } = useContext(DateContext);

    const [storedConfig] = useLocalStorage('timur-config');
    const { googleCalendarEnabled, showEvents } = storedConfig;

    const {
        isConnected: isGoogleCalendarConnected,
        fetchEvents: fetchGoogleCalendarEvents,
    } = useGoogleCalendar();

    const deferredSelectedDate = useDeferredValue(selectedDate);

    const [dayDataResult] = useQuery<
        DayEventsAndDeadlinesQuery,
        DayEventsAndDeadlinesQueryVariables
    >({
        query: DAY_EVENTS_AND_DEADLINES,
        variables: { date: deferredSelectedDate },
        pause: !showEvents,
        requestPolicy: 'cache-and-network',
    });

    const queryClient = useQueryClient();
    const googleEventsPromise = useMemo<Promise<GoogleCalendarEvent[]> | undefined>(() => {
        if (!googleCalendarEnabled || !isGoogleCalendarConnected) {
            return undefined;
        }
        return queryClient.ensureQueryData({
            queryKey: ['googleCalendarEvents', deferredSelectedDate],
            queryFn: () => fetchGoogleCalendarEvents(deferredSelectedDate),
        });
    }, [
        queryClient,
        googleCalendarEnabled,
        isGoogleCalendarConnected,
        deferredSelectedDate,
        fetchGoogleCalendarEvents,
    ]);

    const addedDescriptions = useMemo(() => {
        const set = new Set<string>();
        dayWorkItems.forEach((item) => {
            if (item.description) {
                set.add(item.description.trim().toLowerCase());
            }
        });
        return set;
    }, [dayWorkItems]);

    return (
        <div className={styles.startSidebar}>
            <MonthlyCalendar
                componentRef={calendarComponentRef}
                selectedDate={selectedDate}
                initialYear={selectedDate ? new Date(selectedDate).getFullYear() : year}
                initialMonth={selectedDate ? new Date(selectedDate).getMonth() : month}
                onDateClick={setSelectedDate}
                lastEditedAt={lastEditedAt}
            />
            <Suspense fallback={null}>
                <DayEventChipsSection
                    selectedDate={deferredSelectedDate}
                    showEvents={showEvents}
                    leaveType={leaveType}
                    wfhType={wfhType}
                    allDeadlines={dayDataResult.data?.private.allDeadlines ?? []}
                    events={dayDataResult.data?.private.events.items ?? []}
                    googleEventsPromise={googleEventsPromise}
                />
                {googleEventsPromise && (
                    <GoogleCalendarSection
                        date={deferredSelectedDate}
                        promise={googleEventsPromise}
                        addedDescriptions={addedDescriptions}
                        onWorkItemCreateFromCalendar={onWorkItemCreateFromCalendar}
                    />
                )}
            </Suspense>
            <div className={styles.bottomActions}>
                <Button
                    name={undefined}
                    className={styles.desktopOnly}
                    onClick={onShortcutsClick}
                    title="Show shortcuts"
                    variant="tertiary"
                    icons={<RiTerminalBoxLine />}
                >
                    Shortcuts
                </Button>
                <Link
                    to="settings"
                    title="Settings"
                    variant="tertiary"
                    icons={<RiSettingsLine />}
                >
                    Settings
                </Link>
            </div>
        </div>
    );
}

export default StartSidebar;
