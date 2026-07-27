import { useMemo } from 'react';
import {
    gql,
    useQuery,
} from 'urql';

import DefaultMessage from '#components/DefaultMessage';
import SlideCounter from '#components/SlideCounter';
import StandupConductors from '#components/StandupConductors';
import UpcomingEventsList from '#components/UpcomingEventsList';
import {
    type DeadlinesAndEventsQuery,
    type DeadlinesAndEventsQueryVariables,
} from '#generated/types/graphql';
import useCurrentDate from '#hooks/useCurrentDate';
import { formatDateTime } from '#utils/common';

import Slide from '../Slide';

import styles from './styles.module.css';

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
                    displayName
                    isExternal
                    remainingDays
                }
            }
            relativeEvents {
                id
                name
                remainingDaysToStart
                typeDisplay
                type
            }
        }
    }
`;

interface Props {
    currentSlide: number | undefined;
    totalSlides: number | undefined;
}

function DeadlineSection(props: Props) {
    const { currentSlide, totalSlides } = props;

    const [deadlinesAndEvents] = useQuery<
        DeadlinesAndEventsQuery,
        DeadlinesAndEventsQueryVariables
    >({
        query: DEADLINES_AND_EVENTS,
        requestPolicy: 'cache-and-network',
    });

    const projects = deadlinesAndEvents.data?.private.allProjects;
    const events = deadlinesAndEvents.data?.private.relativeEvents;

    const deadlines = useMemo(
        () => projects?.flatMap((project) => project.deadlines),
        [projects],
    );

    const isEmpty = (deadlines?.length ?? 0) + (events?.length ?? 0) === 0;

    const todayDate = useCurrentDate();

    return (
        <Slide
            variant="split"
            primaryPreText="Welcome!"
            primaryHeading="Daily Standup"
            primaryDescription={(
                <p>
                    A quick sync about what you did yesterday, what&apos;s on for today,
                    and anything blocking you.
                </p>
            )}
            tertiaryContent={(
                <>
                    <div className={styles.subSections}>
                        <StandupConductors />
                    </div>
                    <div className={styles.currentTime}>
                        <span>{formatDateTime(todayDate)}</span>
                        <SlideCounter
                            current={currentSlide}
                            total={totalSlides}
                        />
                    </div>
                </>
            )}
            secondaryHeading="Deadlines & Events"
            secondaryContent={(
                <>
                    <UpcomingEventsList
                        prefixedDeadlineName
                        deadlines={deadlines}
                        events={events}
                    />
                    <DefaultMessage
                        compact
                        filtered={false}
                        empty={isEmpty}
                        pending={isEmpty && deadlinesAndEvents.fetching}
                        errored={!!deadlinesAndEvents.error}
                        pendingMessage="Looking ahead"
                        errorMessage="Something went sideways!"
                        emptyMessage="Nothing on the horizon!"
                    />
                </>
            )}
        />
    );
}

export default DeadlineSection;
