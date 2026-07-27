import {
    Fragment,
    useMemo,
} from 'react';
import {
    FcHighPriority,
    FcLandscape,
    FcMediumPriority,
    FcNews,
    FcNightLandscape,
    FcSportsMode,
} from 'react-icons/fc';
import { compareNumber } from '@togglecorp/fujs';

import { type EventTypeEnum } from '#generated/types/graphql';
import { type GeneralEventType } from '#utils/types';

import AdminEditLink from '../AdminEditLink';
import GeneralEventOutput from '../GeneralEvent';

import styles from './styles.module.css';

interface DeadlineInput {
    id: string;
    name: string;
    displayName: string;
    isExternal: boolean;
    remainingDays: number;
}

interface EventInput {
    id: string;
    type: EventTypeEnum;
    typeDisplay: string;
    name: string;
    remainingDaysToStart: number;
}

const eventIcons: Record<EventTypeEnum, React.ReactNode> = {
    HOLIDAY: <FcLandscape />,
    RETREAT: <FcNightLandscape />,
    MISC: <FcNews />,
};

interface Props {
    prefixedDeadlineName?: boolean;
    hideDaysRemaining?: boolean;
    deadlines?: DeadlineInput[];
    events?: EventInput[];
}

function UpcomingEventsList(props: Props) {
    const {
        prefixedDeadlineName, hideDaysRemaining, deadlines, events,
    } = props;

    const items = useMemo<GeneralEventType[]>(
        () => [
            ...(deadlines?.map((deadline) => ({
                key: `DEADLINE-${deadline.id}`,
                id: deadline.id,
                type: 'DEADLINE' as const,
                typeDisplay: 'Deadline',
                icon: deadline.isExternal ? <FcHighPriority /> : <FcMediumPriority />,
                name: prefixedDeadlineName ? deadline.displayName : deadline.name,
                remainingDays: deadline.remainingDays,
            })) ?? []),
            ...(events?.map((event) => ({
                key: `${event.type}-${event.id}`,
                id: event.id,
                type: event.type,
                typeDisplay: event.typeDisplay,
                icon: eventIcons[event.type],
                name: event.name,
                remainingDays: event.remainingDaysToStart,
            })) ?? []),
        ].sort(
            (a, b) => compareNumber(a.remainingDays, b.remainingDays),
        ),
        [deadlines, events, prefixedDeadlineName],
    );

    return items.map(
        (item, index) => {
            const nextItem = items[index + 1];

            return (
                <Fragment key={item.key}>
                    <AdminEditLink
                        entity={item.type === 'DEADLINE' ? 'deadline' : 'event'}
                        id={item.id}
                    >
                        <GeneralEventOutput
                            generalEvent={item}
                            hideDaysRemaining={hideDaysRemaining}
                        />
                    </AdminEditLink>
                    {item.remainingDays < 0
                        && nextItem
                        && nextItem.remainingDays >= 0
                        && (
                            <div className={styles.separator}>
                                <div className={styles.line} />
                                <FcSportsMode className={styles.icon} />
                                <div className={styles.line} />
                            </div>
                        )}
                </Fragment>
            );
        },
    );
}

export default UpcomingEventsList;
