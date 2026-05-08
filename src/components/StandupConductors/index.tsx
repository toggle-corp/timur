import {
    encodeDate,
    isDefined,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import UsersList from '#components/UsersList';
import {
    type StandupConductorsQuery,
    type StandupConductorsQueryVariables,
} from '#generated/types/graphql';

import styles from './styles.module.css';

const STANDUP_CONDUCTORS = gql`
    query StandupConductors($date: Date!){
        private {
            dailyStandup(date: $date) {
                conductor {
                    id
                    displayName
                    displayPicture
                    leaveToday
                    workFromHomeToday
                }
                fallbackConductor {
                    id
                    displayName
                    displayPicture
                    leaveToday
                    workFromHomeToday
                }
            }
        }
    }
`;

const todayDate = encodeDate(new Date());

function StandupConductors() {
    const [conductorsResponse] = useQuery<StandupConductorsQuery, StandupConductorsQueryVariables>({
        query: STANDUP_CONDUCTORS,
        variables: { date: todayDate },
        requestPolicy: 'cache-and-network',
    });

    const standupConductors = conductorsResponse.data?.private.dailyStandup;

    const conductors = [
        standupConductors?.conductor,
        standupConductors?.fallbackConductor,
    ]
        .filter(isDefined)
        .map((conductor) => ({
            id: conductor.id,
            displayPicture: conductor.displayPicture,
            displayName: conductor.displayName,
            leave: conductor.leaveToday,
            workFromHome: conductor.workFromHomeToday,
        }));

    if (conductors.length === 0) {
        return null;
    }

    return (
        <section className={styles.standupConductors}>
            <h3 className={styles.heading}>
                Conductors
            </h3>
            <UsersList
                users={conductors}
                strikeoutForStandup
            />
        </section>
    );
}

export default StandupConductors;
