import { useMemo } from 'react';
import {
    FcCalendar,
    FcHighPriority,
    FcHome,
    FcLandscape,
    FcLeave,
    FcNews,
    FcNightLandscape,
} from 'react-icons/fc';
import { useSuspenseQuery } from '@tanstack/react-query';
import { _cs } from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import Pill from '#components/Pill';
import {
    type DayEventsAndDeadlinesQuery,
    type DayEventsAndDeadlinesQueryVariables,
    type JournalLeaveTypeEnum,
    type JournalWorkFromHomeTypeEnum,
} from '#generated/types/graphql';
import useGoogleCalendar from '#hooks/useGoogleCalendar';

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
        }
    }
`;

const CONTEXT = { suspense: true } as const;

type Deadline = DayEventsAndDeadlinesQuery['private']['allDeadlines'][number];
type DayEvent = DayEventsAndDeadlinesQuery['private']['events']['items'][number];

function leaveTypeLabel(type: JournalLeaveTypeEnum) {
    if (type === 'FULL') {
        return 'Full leave';
    }
    if (type === 'FIRST_HALF') {
        return 'First half leave';
    }
    if (type === 'SECOND_HALF') {
        return 'Second half leave';
    }
    return 'Leave';
}

function wfhTypeLabel(type: JournalWorkFromHomeTypeEnum) {
    if (type === 'FULL') {
        return 'WFH';
    }
    if (type === 'FIRST_HALF') {
        return 'First half WFH';
    }
    if (type === 'SECOND_HALF') {
        return 'Second half WFH';
    }
    return 'WFH';
}

interface Chip {
    key: string;
    icon: React.ReactNode;
    name: string;
}

interface GoogleAllDayChipsProps {
    date: string;
}

function GoogleAllDayChips(props: GoogleAllDayChipsProps) {
    const { date } = props;
    const { fetchEvents } = useGoogleCalendar();

    const { data: googleEvents } = useSuspenseQuery({
        queryKey: ['googleCalendarEvents', date],
        queryFn: () => fetchEvents(date, { fullDayOnly: true }),
    });

    return (
        <>
            {googleEvents
                .filter((event) => !event.start.dateTime)
                .map((event) => (
                    <Pill
                        key={`gcal-${event.id}`}
                        icon={<FcCalendar />}
                    >
                        {event.summary ?? '(No title)'}
                    </Pill>
                ))}
        </>
    );
}

interface Props {
    selectedDate: string;
    showEvents: boolean;
    leaveType?: JournalLeaveTypeEnum | null;
    wfhType?: JournalWorkFromHomeTypeEnum | null;
    googleCalendarEnabled?: boolean;
    loading?: boolean;
}

function DayEventChipsSection(props: Props) {
    const {
        selectedDate,
        showEvents,
        leaveType,
        wfhType,
        googleCalendarEnabled,
        loading,
    } = props;

    const [dayDataResult] = useQuery<
        DayEventsAndDeadlinesQuery,
        DayEventsAndDeadlinesQueryVariables
    >({
        query: DAY_EVENTS_AND_DEADLINES,
        variables: { date: selectedDate },
        pause: !showEvents,
        requestPolicy: 'cache-and-network',
        context: CONTEXT,
    });

    const allDeadlines: Deadline[] = dayDataResult.data?.private.allDeadlines ?? [];
    const events: DayEvent[] = dayDataResult.data?.private.events.items ?? [];

    const dayEventChips = useMemo<Chip[]>(() => {
        const eventIcons = {
            HOLIDAY: <FcLandscape />,
            RETREAT: <FcNightLandscape />,
            MISC: <FcNews />,
        } as const;

        const leaveChips: Chip[] = leaveType
            ? [{
                key: `leave-${leaveType}`,
                icon: <FcLeave />,
                name: leaveTypeLabel(leaveType),
            }]
            : [];

        const wfhChips: Chip[] = wfhType
            ? [{
                key: `wfh-${wfhType}`,
                icon: <FcHome />,
                name: wfhTypeLabel(wfhType),
            }]
            : [];

        const deadlineChips: Chip[] = showEvents
            ? allDeadlines
                .filter((deadline) => deadline.endDate === selectedDate)
                .map((deadline) => ({
                    key: `deadline-${deadline.id}`,
                    icon: deadline.isExternal ? <FcHighPriority /> : <FcLeave />,
                    name: deadline.displayName,
                }))
            : [];

        const eventChips: Chip[] = showEvents
            ? events.map((event) => ({
                key: `event-${event.id}`,
                icon: eventIcons[event.type as keyof typeof eventIcons],
                name: event.name,
            }))
            : [];

        return [...leaveChips, ...wfhChips, ...deadlineChips, ...eventChips];
    }, [
        showEvents,
        allDeadlines,
        events,
        selectedDate,
        leaveType,
        wfhType,
    ]);

    if (dayEventChips.length === 0 && !googleCalendarEnabled) {
        return null;
    }

    return (
        <div
            className={_cs(
                styles.dayEvents,
                loading && styles.loading,
            )}
        >
            {dayEventChips.map((item) => (
                <Pill
                    key={item.key}
                    icon={item.icon}
                >
                    {item.name}
                </Pill>
            ))}
            {googleCalendarEnabled && (
                <GoogleAllDayChips date={selectedDate} />
            )}
        </div>
    );
}

export default DayEventChipsSection;
