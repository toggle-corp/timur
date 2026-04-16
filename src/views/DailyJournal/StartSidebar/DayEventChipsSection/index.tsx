import {
    use,
    useMemo,
} from 'react';
import {
    FcCalendar,
    FcHighPriority,
    FcHome,
    FcLandscape,
    FcLeave,
    FcNews,
    FcNightLandscape,
} from 'react-icons/fc';

import Pill from '#components/Pill';
import {
    type DayEventsAndDeadlinesQuery,
    type JournalLeaveTypeEnum,
    type JournalWorkFromHomeTypeEnum,
} from '#generated/types/graphql';
import { type GoogleCalendarEvent } from '#hooks/useGoogleCalendar';

import styles from './styles.module.css';

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

interface Props {
    selectedDate: string;
    showEvents: boolean;
    leaveType?: JournalLeaveTypeEnum | null;
    wfhType?: JournalWorkFromHomeTypeEnum | null;
    allDeadlines: Deadline[];
    events: DayEvent[];
    googleEventsPromise?: Promise<GoogleCalendarEvent[]>;
}

function DayEventChipsSection(props: Props) {
    const {
        selectedDate,
        showEvents,
        leaveType,
        wfhType,
        allDeadlines,
        events,
        googleEventsPromise,
    } = props;

    const googleEvents = googleEventsPromise ? use(googleEventsPromise) : undefined;

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

        const googleChips: Chip[] = (googleEvents ?? [])
            .filter((event) => !event.start.dateTime)
            .map((event) => ({
                key: `gcal-${event.id}`,
                icon: <FcCalendar />,
                name: event.summary ?? '(No title)',
            }));

        return [...leaveChips, ...wfhChips, ...deadlineChips, ...eventChips, ...googleChips];
    }, [
        showEvents,
        allDeadlines,
        events,
        selectedDate,
        leaveType,
        wfhType,
        googleEvents,
    ]);

    if (dayEventChips.length === 0) {
        return null;
    }

    return (
        <div className={styles.dayEvents}>
            {dayEventChips.map((item) => (
                <Pill
                    key={item.key}
                    icon={item.icon}
                >
                    {item.name}
                </Pill>
            ))}
        </div>
    );
}

export default DayEventChipsSection;
