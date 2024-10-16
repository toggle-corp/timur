import {
    compareNumber,
    compareString,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import AvailabilityIndicator from '#components/AvailabilityIndicator';
import Clock from '#components/Clock';
import DisplayPicture from '#components/DisplayPicture';
import {
    type JournalLeaveTypeEnum,
    type JournalWorkFromHomeTypeEnum,
    type UsersAvailabilityQuery,
    type UsersAvailabilityQueryVariables,
} from '#generated/types/graphql';

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

function StartSection() {
    const [usersAvailability] = useQuery<
        UsersAvailabilityQuery,
        UsersAvailabilityQueryVariables
    >({
        query: USERS_AVAILABILITY,
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
        );

    return (
        <Slide
            variant="split"
            className={styles.startSection}
            primaryPreText="Welcome to"
            primaryHeading="Daily Standup"
            primaryDescription={<Clock />}
            secondaryHeading="Availability"
            secondaryContent={sortedUsers?.map((user) => (
                <div
                    key={user.id}
                    role="listitem"
                    className={styles.user}
                >
                    <DisplayPicture
                        className={styles.displayPicture}
                        imageUrl={user.displayPicture}
                        displayName={user.displayName ?? 'Anon'}
                    />
                    <div className={styles.name}>
                        {user.displayName ?? 'Anon'}
                        {' '}
                        <AvailabilityIndicator
                            wfhType={user.workFromHomeToday}
                            leaveType={user.leaveToday}
                        />
                    </div>
                </div>
            ))}
        />
    );
}

export default StartSection;
