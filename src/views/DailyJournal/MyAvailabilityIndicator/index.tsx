import { RiHomeOfficeLine } from 'react-icons/ri';
import {
    gql,
    useQuery,
} from 'urql';

import AvailabilityIndicator from '#components/AvailabilityIndicator';
import {
    MyJournalAvailabilityQuery,
    MyJournalAvailabilityQueryVariables,
} from '#generated/types/graphql';

const MY_JOURNAL_AVAILABILITY_QUERY = gql`
    query MyJournalAvailability($date: Date!) {
        private {
            id
            journal(date: $date) {
                id
                date
                leaveType
                wfhType
            }
        }
    }
`;

interface Props {
    date: string;
}

function MyAvailabilityIndicator(props: Props) {
    const { date } = props;

    const [result] = useQuery<
        MyJournalAvailabilityQuery,
        MyJournalAvailabilityQueryVariables
    >({
        query: MY_JOURNAL_AVAILABILITY_QUERY,
        variables: { date },
    });

    const leaveType = result.data?.private.journal?.leaveType;
    const wfhType = result.data?.private.journal?.wfhType;

    return (
        <AvailabilityIndicator
            wfhType={wfhType}
            leaveType={leaveType}
            fallback={<RiHomeOfficeLine />}
        />
    );
}

export default MyAvailabilityIndicator;
