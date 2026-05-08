import { _cs } from '@togglecorp/fujs';

import AvailabilityIndicator from '#components/AvailabilityIndicator';
import DisplayPicture from '#components/DisplayPicture';
import {
    type JournalLeaveTypeEnum,
    type JournalWorkFromHomeTypeEnum,
} from '#generated/types/graphql';

import styles from './styles.module.css';

interface UserItem {
    id: string;
    displayPicture?: string | null;
    displayName?: string | null;
    leave?: JournalLeaveTypeEnum | null;
    workFromHome?: JournalWorkFromHomeTypeEnum | null;
}

interface Props {
    users: UserItem[];
    strikeoutForStandup?: boolean;
}

function UsersList(props: Props) {
    const { users, strikeoutForStandup } = props;

    return users.map((user) => (
        <div
            key={user.id}
            role="listitem"
            className={styles.user}
        >
            <DisplayPicture
                className={styles.displayPicture}
                imageUrl={user.displayPicture}
                displayName={user.displayName ?? 'Hari Bahadur'}
            />
            <div
                className={_cs(
                    styles.name,
                    strikeoutForStandup
                        && (user.leave === 'FIRST_HALF' || user.leave === 'FULL')
                        && styles.unavailable,
                )}
            >
                {user.displayName ?? 'Hari Bahadur'}
                {' '}
                <AvailabilityIndicator
                    wfhType={user.workFromHome}
                    leaveType={user.leave}
                />
            </div>
        </div>
    ));
}

export default UsersList;
