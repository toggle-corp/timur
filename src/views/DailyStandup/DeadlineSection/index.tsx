import {
    Fragment,
    useMemo,
} from 'react';
import {
    FcLandscape,
    FcLeave,
    FcNews,
    FcNightLandscape,
    FcSportsMode,
} from 'react-icons/fc';
import {
    compareDate,
    getDifferenceInDays,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import {
    type DeadlinesAndEventsQuery,
    type DeadlinesAndEventsQueryVariables,
} from '#generated/types/graphql';
import { type GeneralEvent } from '#utils/types';

import GeneralEventOutput from '../GeneralEvent';
import Slide from '../Slide';

import styles from './styles.module.css';

const dateFormatter = new Intl.DateTimeFormat(
    [],
    {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
    },
);

const DEADLINES_AND_EVENTS = gql`
    query DeadlinesAndEvents {
        private {
            id
            allProjects {
                id
                name
                deadlines {
                    id
                    name
                    remainingDays
                    endDate
                    totalDays
                    usedDays
                    projectId
                }
            }
            relativeEvents {
                id
                name
                startDate
                typeDisplay
                dates
                endDate
                type
            }
        }
    }
`;

interface Props {
    date: string;
}

function DeadlineSection(props: Props) {
    const {
        date,
    } = props;

    const [deadlinesAndEvents] = useQuery<
        DeadlinesAndEventsQuery,
        DeadlinesAndEventsQueryVariables
    >({
        query: DEADLINES_AND_EVENTS,
    });

    const projects = deadlinesAndEvents.data?.private.allProjects;
    const events = deadlinesAndEvents.data?.private.relativeEvents;

    const formattedDate = dateFormatter.format(new Date(date));

    const upcomingEvents = useMemo<GeneralEvent[]>(() => {
        const deadlines = projects?.flatMap(
            (project) => project.deadlines.map((deadline) => ({
                ...deadline,
                name: `${project.name}: ${deadline.name}`,
            })),
        );

        const iconsMap: Record<GeneralEvent['type'], React.ReactNode> = {
            DEADLINE: <FcLeave />,
            HOLIDAY: <FcLandscape />,
            RETREAT: <FcNightLandscape />,
            MISC: <FcNews />,
        };

        return [
            ...(deadlines?.map((deadline) => ({
                key: `DEADLINE-${deadline.id}`,
                type: 'DEADLINE' as const,
                typeDisplay: 'Deadline',
                icon: iconsMap.DEADLINE,
                name: deadline.name,
                date: deadline.endDate,
                remainingDays: deadline.remainingDays,
            })) ?? []),
            ...(events?.map((otherEvent) => ({
                key: `${otherEvent.type}-${otherEvent.id}`,
                type: otherEvent.type,
                icon: iconsMap[otherEvent.type],
                typeDisplay: otherEvent.typeDisplay,
                name: otherEvent.name,
                date: otherEvent.startDate,
                remainingDays: getDifferenceInDays(
                    otherEvent.startDate,
                    date,
                ),
            })) ?? []),
        ].sort((a, b) => compareDate(a.date, b.date));
    }, [events, projects, date]);

    return (
        <Slide
            variant="split"
            primaryPreText="Welcome to"
            primaryHeading="Daily Standup"
            primaryDescription={formattedDate}
            secondaryHeading="Upcoming Events"
            secondaryContent={upcomingEvents.map(
                (generalEvent, index) => (
                    <Fragment key={generalEvent.key}>
                        <GeneralEventOutput
                            generalEvent={generalEvent}
                        />
                        {generalEvent.remainingDays < 0
                            && upcomingEvents[index + 1]?.remainingDays >= 0
                            && (
                                <div className={styles.separator}>
                                    <div className={styles.line} />
                                    <FcSportsMode className={styles.icon} />
                                    <div className={styles.line} />
                                </div>
                            )}
                    </Fragment>
                ),
            )}
        />
    );
}

export default DeadlineSection;
