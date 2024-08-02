import { useMemo } from 'react';
import { IoTimerOutline } from 'react-icons/io5';
import { _cs } from '@togglecorp/fujs';

import Message from '#components/Message';

import styles from './styles.module.css';
import { GiShrug } from 'react-icons/gi';

interface Props {
    className?: string;
    compact?: boolean;
    pending: boolean;
    overlayPending?: boolean;
    filtered: boolean;
    empty: boolean;
    errored: boolean;

    emptyMessage?: React.ReactNode;
    filteredEmptyMessage?: React.ReactNode;
    pendingMessage?: React.ReactNode;
    errorMessage?: React.ReactNode;
}

function DefaultMessage(props: Props) {
    const {
        className,
        compact,
        pending,
        overlayPending,
        filtered,
        empty,
        errored,

        emptyMessage,
        filteredEmptyMessage,
        pendingMessage,
        errorMessage,
    } = props;

    const messageTitle = useMemo(
        () => {
            if (pending) {
                return pendingMessage ?? 'Fetching data...';
            }

            if (errored) {
                return errorMessage ?? 'Failed to fetch data!';
            }

            if (filtered) {
                return filteredEmptyMessage ?? 'Data is not available for selected filter!';
            }

            if (empty) {
                return emptyMessage ?? 'Data is not available!';
            }

            return null;
        },
        [
            empty,
            pending,
            filtered,
            errored,
            emptyMessage,
            filteredEmptyMessage,
            pendingMessage,
            errorMessage,
        ],
    );

    if (!empty && !pending && !errored) {
        return null;
    }

    return (
        <Message
            className={_cs(
                styles.defaultMessage,
                pending && overlayPending && styles.overlay,
                className,
            )}
            icon={<GiShrug />}
            compact={compact}
            title={messageTitle}
            pending={pending}
        />
    );
}

export default DefaultMessage;
