import {
    _cs,
    encodeDate,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import DisplayPicture from '#components/DisplayPicture';
import TextOutput from '#components/TextOutput';
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
                }
                fallbackConductor {
                    id
                    displayName
                    displayPicture
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

    return (
        <div className={styles.conductors}>
            <TextOutput
                className={_cs(
                    styles.conductorItem,
                    !standupConductors && styles.hidden,
                )}
                label="Standup Lead"
                valueContainerClassName={styles.conductorValue}
                value={(
                    <>
                        <DisplayPicture
                            imageUrl={standupConductors?.conductor?.displayPicture}
                            displayName={standupConductors?.conductor?.displayName ?? 'Anonymous'}
                        />
                        <span>
                            {standupConductors?.conductor?.displayName
                                ?? 'Anonymous'}
                        </span>
                    </>
                )}
                block
                hideLabelColon
            />
            <TextOutput
                className={_cs(
                    styles.conductorItem,
                    !standupConductors && styles.hidden,
                )}
                label="Acting Lead"
                valueContainerClassName={styles.conductorValue}
                value={(
                    <>
                        <DisplayPicture
                            imageUrl={standupConductors
                                ?.fallbackConductor?.displayPicture}
                            displayName={standupConductors?.fallbackConductor?.displayName ?? 'Anonymous'}
                        />
                        <span>
                            {standupConductors?.fallbackConductor?.displayName
                                ?? 'Anonymous'}
                        </span>
                    </>
                )}
                block
                hideLabelColon
            />
        </div>
    );
}

export default StandupConductors;
