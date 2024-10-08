import {
    _cs,
    isNotDefined,
} from '@togglecorp/fujs';

import DefaultMessage from '#components/DefaultMessage';
import RawList, {
    type ListKey,
    type Props as RawListProps,
} from '#components/RawList';

import styles from './styles.module.css';

interface Props<
    DATUM,
    KEY extends ListKey,
    RENDERER_PROPS
> extends RawListProps<DATUM, KEY, RENDERER_PROPS> {
    className?: string;
    messageClassName?: string;

    pending: boolean;
    errored: boolean;
    filtered: boolean;

    emptyMessage?: React.ReactNode;
    filteredEmptyMessage?: React.ReactNode;
    pendingMessage?: React.ReactNode;
    errorMessage?: React.ReactNode;
    emptyDescription?: React.ReactNode;
    filteredEmptyDescription?: React.ReactNode;
    pendingDescription?: React.ReactNode;
    errorDescription?: React.ReactNode;

    compact?: boolean;
    withoutMessage?: boolean;
    showSeparator?: boolean;
}

function List<DATUM, KEY extends ListKey, RENDERER_PROPS>(
    props: Props<DATUM, KEY, RENDERER_PROPS>,
) {
    const {
        className,
        data,
        keySelector,
        renderer,
        rendererParams,

        pending,
        errored,
        filtered,

        errorMessage,
        emptyMessage,
        pendingMessage,
        filteredEmptyMessage,
        errorDescription,
        emptyDescription,
        pendingDescription,
        filteredEmptyDescription,

        compact,
        withoutMessage = false,
        messageClassName,
        showSeparator,
    } = props;

    const isEmpty = isNotDefined(data) || data.length === 0;

    return (
        <div
            className={_cs(
                styles.list,
                compact && styles.compact,
                pending && styles.pending,
                className,
            )}
        >
            <RawList
                data={data}
                keySelector={keySelector}
                renderer={renderer}
                rendererParams={rendererParams}
                separator={showSeparator && <hr className={styles.separator} />}
            />
            {!withoutMessage && (
                <DefaultMessage
                    className={messageClassName}
                    pending={pending}
                    filtered={filtered}
                    empty={isEmpty}
                    errored={errored}
                    compact={compact}
                    emptyMessage={emptyMessage}
                    filteredEmptyMessage={filteredEmptyMessage}
                    pendingMessage={pendingMessage}
                    errorMessage={errorMessage}
                    emptyDescription={emptyDescription}
                    filteredEmptyDescription={filteredEmptyDescription}
                    pendingDescription={pendingDescription}
                    errorDescription={errorDescription}
                    overlayPending
                />
            )}
        </div>
    );
}

export default List;
