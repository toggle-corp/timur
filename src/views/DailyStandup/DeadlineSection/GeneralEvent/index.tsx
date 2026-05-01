import { _cs } from '@togglecorp/fujs';

import { GeneralEvent as GeneralEventType } from '#utils/types';

import styles from './styles.module.css';

function getFormattedDaysRemaining(numDays: number) {
    if (numDays === 0) {
        return 'Today';
    }

    /*
    if (numDays === 1) {
        return 'Tomorrow';
    }

    if (numDays === -1) {
        return 'Yesterday';
    }
    */

    const dayLabel = Math.abs(numDays) === 1 ? 'day' : 'days';

    return numDays < 0
        ? `${numDays * -1} ${dayLabel} ago`
        : `In ${numDays} ${dayLabel}`;
}

interface Props {
    generalEvent: GeneralEventType;
}

function GeneralEvent(props: Props) {
    const { generalEvent } = props;

    return (
        <div
            className={_cs(
                styles.generalEvent,
                generalEvent.remainingDays < 0 && styles.pastEvent,
            )}
        >
            <div className={styles.icon}>
                {generalEvent.icon}
            </div>
            <div className={styles.days}>
                {getFormattedDaysRemaining(generalEvent.remainingDays)}
            </div>
            <div className={styles.name}>
                {generalEvent.name}
            </div>
        </div>
    );
}

export default GeneralEvent;
