import { useMemo } from 'react';
import {
    FcAlarmClock,
    FcDislike,
} from 'react-icons/fc';
import { _cs } from '@togglecorp/fujs';

import Message from '#components/Message';

import styles from './styles.module.css';

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
    emptyDescription?: React.ReactNode;
    filteredEmptyDescription?: React.ReactNode;
    pendingDescription?: React.ReactNode;
    errorDescription?: React.ReactNode;
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
        emptyDescription,
        filteredEmptyDescription,
        pendingDescription,
        errorDescription,
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

    const messageDescription = useMemo(
        () => {
            if (pending) {
                return pendingDescription;
            }

            if (errored) {
                return errorDescription;
            }

            if (filtered) {
                return filteredEmptyDescription;
            }

            if (empty) {
                return emptyDescription;
            }

            return null;
        },
        [
            empty,
            pending,
            filtered,
            errored,
            emptyDescription,
            filteredEmptyDescription,
            pendingDescription,
            errorDescription,
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
            icon={pending ? <FcAlarmClock /> : <FcDislike />}
            compact={compact}
            title={messageTitle}
            description={messageDescription}
        />
    );
}

export default DefaultMessage;
