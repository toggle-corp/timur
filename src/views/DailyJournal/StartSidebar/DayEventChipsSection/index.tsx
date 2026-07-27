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
import { _cs } from '@togglecorp/fujs';

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
    loading?: boolean;
    dayData: DayEventsAndDeadlinesQuery | undefined;
    googleEvents: GoogleCalendarEvent[];
}

function DayEventChipsSection(props: Props) {
    const {
        selectedDate,
        loading,
        dayData,
        googleEvents,
    } = props;

    const leaveType = dayData?.private.journal?.leaveType;
    const wfhType = dayData?.private.journal?.wfhType;

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

        const allDeadlines: Deadline[] = dayData?.private.allDeadlines ?? [];
        const deadlineChips: Chip[] = allDeadlines
            .filter((deadline) => deadline.endDate === selectedDate)
            .map((deadline) => ({
                key: `deadline-${deadline.id}`,
                icon: deadline.isExternal ? <FcHighPriority /> : <FcLeave />,
                name: deadline.displayName,
            }));

        const events: DayEvent[] = dayData?.private.events.items ?? [];
        const eventChips: Chip[] = events.map((event) => ({
            key: `event-${event.id}`,
            icon: eventIcons[event.type as keyof typeof eventIcons],
            name: event.name,
        }));

        const allDayGoogleChips: Chip[] = googleEvents
            .filter((event) => !event.start.dateTime)
            .map((event) => ({
                key: `gcal-${event.id}`,
                icon: <FcCalendar />,
                name: event.summary ?? '(No title)',
            }));

        return [
            ...leaveChips,
            ...wfhChips,
            ...deadlineChips,
            ...eventChips,
            ...allDayGoogleChips,
        ];
    }, [
        dayData,
        selectedDate,
        leaveType,
        wfhType,
        googleEvents,
    ]);

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
        </div>
    );
}

export default DayEventChipsSection;
