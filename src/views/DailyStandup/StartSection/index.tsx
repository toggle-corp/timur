import {
    compareNumber,
    compareString,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import DefaultMessage from '#components/DefaultMessage';
import SlideCounter from '#components/SlideCounter';
import StandupConductors from '#components/StandupConductors';
import UsersList from '#components/UsersList';
import {
    type JournalLeaveTypeEnum,
    type JournalWorkFromHomeTypeEnum,
    type UsersAvailabilityQuery,
    type UsersAvailabilityQueryVariables,
} from '#generated/types/graphql';
import useCurrentDate from '#hooks/useCurrentDate';
import { formatDateTime } from '#utils/common';

import Slide from '../Slide';

import styles from './styles.module.css';

function getUnavailability(
    leave: JournalLeaveTypeEnum | null | undefined,
    wfh: JournalWorkFromHomeTypeEnum | null | undefined,
) {
    let sum = 0;
    if (leave === 'FULL') {
        sum += 1;
    } else if (leave === 'FIRST_HALF' || leave === 'SECOND_HALF') {
        sum += 0.5;
    }
    if (wfh === 'FULL') {
        sum += 0.2;
    } else if (wfh === 'FIRST_HALF' || wfh === 'SECOND_HALF') {
        sum += 0.1;
    }
    return sum;
}

const USERS_AVAILABILITY = gql`
    query UsersAvailability {
        private {
            id
            users(pagination: {limit: 999}, filters: {departments: [DEVELOPMENT, DESIGN, PROJECT_MANAGER, QUALITY_ASSURANCE]}) {
                items {
                    id
                    leaveToday
                    workFromHomeToday
                    displayPicture
                    displayName
                }
            }
        }
    }
`;

interface Props {
    currentSlide: number | undefined;
    totalSlides: number | undefined;
}

function StartSection(props: Props) {
    const { currentSlide, totalSlides } = props;

    const [usersAvailability] = useQuery<
        UsersAvailabilityQuery,
        UsersAvailabilityQueryVariables
    >({
        query: USERS_AVAILABILITY,
        requestPolicy: 'cache-and-network',
    });

    // FIXME: need to check how to sort these information
    const sortedUsers = usersAvailability.data?.private.users.items
        .filter((item) => item.leaveToday || item.workFromHomeToday)
        .sort(
            (foo, bar) => compareNumber(
                getUnavailability(foo.leaveToday, foo.workFromHomeToday),
                getUnavailability(bar.leaveToday, bar.workFromHomeToday),
                -1,
            ) || compareString(
                foo.displayName,
                bar.displayName,
            ),
        )
        .map((user) => ({
            id: user.id,
            displayPicture: user.displayPicture,
            displayName: user.displayName,
            leave: user.leaveToday,
            workFromHome: user.workFromHomeToday,
        })) ?? [];
    const todayDate = useCurrentDate();

    return (
        <Slide
            variant="split"
            className={styles.startSection}
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
            secondaryHeading="Out of office"
            secondaryContent={(
                <>
                    <UsersList
                        users={sortedUsers}
                    />
                    <DefaultMessage
                        compact
                        filtered={false}
                        empty={sortedUsers.length === 0}
                        pending={sortedUsers.length === 0 && usersAvailability.fetching}
                        errored={!!usersAvailability.error}
                        pendingMessage="Checking who's around"
                        errorMessage="Something went sideways!"
                        emptyMessage="Looks like everyone is here!"
                    />
                </>
            )}
        />
    );
}

export default StartSection;
