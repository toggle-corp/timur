import {
    Suspense,
    useDeferredValue,
    useMemo,
} from 'react';
import {
    RiSettingsLine,
    RiTerminalBoxLine,
} from 'react-icons/ri';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
    gql,
    useQuery,
} from 'urql';

import Button from '#components/Button';
import DefaultMessage from '#components/DefaultMessage';
import Link from '#components/Link';
import MonthlyCalendar from '#components/MonthlyCalendar';
import {
    type DayEventsAndDeadlinesQuery,
    type DayEventsAndDeadlinesQueryVariables,
} from '#generated/types/graphql';
import useGoogleCalendar from '#hooks/useGoogleCalendar';
import { type WorkItem } from '#utils/types';

import DayEventChipsSection from './DayEventChipsSection';
import GoogleCalendarSection from './GoogleCalendarSection';

import styles from './styles.module.css';

// TODO: events are paginated. use separate api
const DAY_EVENTS_AND_DEADLINES = gql`
    query DayEventsAndDeadlines($date: Date!) {
        private {
            id
            events(
                pagination: { limit: 999 },
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
            allDeadlines(
                filters: {
                    endDate: { lte: $date, gte: $date }
                    isArchived: { inList: [true, false] }
                }
            ) {
                id
                displayName
                isExternal
                endDate
            }
            journal(date: $date) {
                id
                date
                leaveType
                wfhType
            }
        }
    }
`;

const QUERY_CONTEXT = { suspense: true } as const;

interface DayEventsAndCalendarProps {
    selectedDate: string;
    addedDescriptions: Set<string>;
    onWorkItemCreateFromCalendar: (override: Partial<WorkItem>) => void;
}

function DayEventsAndCalendar(props: DayEventsAndCalendarProps) {
    const {
        selectedDate,
        addedDescriptions,
        onWorkItemCreateFromCalendar,
    } = props;

    const deferredSelectedDate = useDeferredValue(selectedDate);
    const loading = selectedDate !== deferredSelectedDate;

    const { fetchEvents, isConnected } = useGoogleCalendar();

    const [dayDataResult] = useQuery<
        DayEventsAndDeadlinesQuery,
        DayEventsAndDeadlinesQueryVariables
    >({
        query: DAY_EVENTS_AND_DEADLINES,
        variables: { date: deferredSelectedDate },
        context: QUERY_CONTEXT,
        requestPolicy: 'cache-first',
    });

    const { data: googleEvents } = useSuspenseQuery({
        queryKey: ['googleCalendarEvents', isConnected, deferredSelectedDate],
        queryFn: () => (isConnected ? fetchEvents(deferredSelectedDate) : Promise.resolve([])),
        staleTime: Infinity,
    });

    return (
        <>
            <DayEventChipsSection
                loading={loading}
                selectedDate={deferredSelectedDate}
                dayData={dayDataResult.data}
                googleEvents={googleEvents}
            />
            {isConnected && (
                <GoogleCalendarSection
                    loading={loading}
                    date={deferredSelectedDate}
                    addedDescriptions={addedDescriptions}
                    onWorkItemCreateFromCalendar={onWorkItemCreateFromCalendar}
                    googleEvents={googleEvents}
                />
            )}
        </>
    );
}

interface Props {
    selectedDate: string;
    setSelectedDate: (newDate: string) => void;
    onWorkItemCreateFromCalendar: (override: Partial<WorkItem>) => void;
    onShortcutsClick: () => void;
    dayWorkItems: WorkItem[];
    lastEditedAt: number | null;
}

function StartSidebar(props: Props) {
    const {
        selectedDate,
        setSelectedDate,
        onShortcutsClick,
        onWorkItemCreateFromCalendar,
        dayWorkItems,
        lastEditedAt,
    } = props;

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
                selectedDate={selectedDate}
                onDateClick={setSelectedDate}
                lastEditedAt={lastEditedAt}
            />
            <Suspense
                fallback={(
                    <DefaultMessage
                        compact
                        filtered={false}
                        empty={false}
                        errored={false}
                        pending
                        pendingMessage="Searching the universe"
                    />
                )}
            >
                <DayEventsAndCalendar
                    selectedDate={selectedDate}
                    addedDescriptions={addedDescriptions}
                    onWorkItemCreateFromCalendar={onWorkItemCreateFromCalendar}
                />
            </Suspense>
            <div className={styles.bottomActions}>
                <Button
                    name={undefined}
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
