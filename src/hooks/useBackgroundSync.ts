import {
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
} from 'react';
import {
    isDefined,
    isNotDefined,
    listToMap,
} from '@togglecorp/fujs';

import {
    getChangedItems,
    mergeList,
} from '#utils/common';

type SetAction<T> = T | ((oldValue: T) => T);

interface Base {
    id?: string | null,
    clientId: string
}

interface State<T extends Base> {
    serverState: T[],
    localState: T[],
}

interface RemoveLocalStateItem {
    type: 'REMOVE_LOCAL_STATE_ITEM',
    clientId: string;
}
interface UpdateServerStateItems<T extends Base> {
    type: 'UPDATE_SERVER_STATE_ITEMS',
    value: T[],
}
interface UpdateLocalStateItems<T extends Base> {
    type: 'UPDATE_LOCAL_STATE_ITEMS',
    value: T[],
}
interface SetCombinedState<T extends Base> {
    type: 'SET_COMBINED_STATE',
    localValue: SetAction<T[]>,
    serverValue: SetAction<T[]>,
}

type Actions<T extends Base> = RemoveLocalStateItem
| UpdateServerStateItems<T>
| UpdateLocalStateItems<T>
| SetCombinedState<T>;

function stateReducer<T extends Base>(prevState: State<T>, action: Actions<T>): State<T> {
    if (action.type === 'REMOVE_LOCAL_STATE_ITEM') {
        if (!prevState.localState) {
            return prevState.localState;
        }
        const newData = [...prevState.localState ?? []];
        const obsoleteIndex = newData?.findIndex(
            (item) => item.clientId === action.clientId,
        );
        if (obsoleteIndex !== -1) {
            newData.splice(obsoleteIndex, 1);
        }

        return {
            ...prevState,
            localState: newData,
        };
    }
    if (action.type === 'UPDATE_SERVER_STATE_ITEMS') {
        return {
            ...prevState,
            serverState: mergeList(
                prevState.serverState,
                action.value,
                (item) => item.clientId,
            ),
        };
    }
    if (action.type === 'UPDATE_LOCAL_STATE_ITEMS') {
        return {
            ...prevState,
            localState: mergeList(
                prevState.localState,
                action.value,
                (item) => item.clientId,
            ),
        };
    }
    if (action.type === 'SET_COMBINED_STATE') {
        const localValue = typeof action.localValue === 'function'
            ? action.localValue(prevState.localState)
            : action.localValue;
        const serverValue = typeof action.serverValue === 'function'
            ? action.serverValue(prevState.serverState)
            : action.serverValue;

        return {
            ...prevState,
            localState: localValue,
            serverState: serverValue,
        };
    }
    // eslint-disable-next-line no-console
    console.error('Action is not supported');
    return prevState;
}

function useBackgroundSync<T extends Base>(
    action: (
        addedItems: T[],
        updatedItems: T[],
        deletedItems: string[],
    ) => Promise<{ ok: true, savedValues: T[], deletedValues: string[] } | { ok: false }>,
) {
    const diffTriggerRef = useRef<number>();

    const [
        state,
        dispatch,
    ] = useReducer<React.Reducer<State<T>, Actions<T>>>(
        stateReducer,
        {
            serverState: [],
            localState: [],
        },
    );

    const {
        localState,
        serverState,
    } = state;

    const addOrUpdateServerData = useCallback(
        (workItems: T[] | undefined) => {
            if (isDefined(workItems) && workItems.length > 0) {
                dispatch({
                    type: 'UPDATE_SERVER_STATE_ITEMS',
                    value: workItems ?? [],
                });
            }
        },
        [],
    );

    const addOrUpdateLocalData = useCallback(
        (workItems: T[] | undefined) => {
            if (isDefined(workItems) && workItems.length > 0) {
                dispatch({
                    type: 'UPDATE_LOCAL_STATE_ITEMS',
                    value: workItems ?? [],
                });
            }
        },
        [],
    );

    const removeFromStateData = useCallback(
        (key: string | null | undefined) => {
            if (isDefined(key)) {
                dispatch({
                    type: 'REMOVE_LOCAL_STATE_ITEM',
                    clientId: key,
                });
            }
        },
        [],
    );

    const setStateData = useCallback(
        (localValue: SetAction<T[]>, serverValue: SetAction<T[]>) => {
            const setStateDataAction: SetCombinedState<T> = {
                type: 'SET_COMBINED_STATE',
                localValue,
                serverValue,
            };
            dispatch(setStateDataAction);
        },
        [],
    );

    useEffect(
        () => {
            window.clearTimeout(diffTriggerRef.current);

            if (localState === serverState) {
                // eslint-disable-next-line no-console
                console.info('No change detected at all...');
                return;
            }

            // eslint-disable-next-line no-console
            console.info('Background sync queued.');
            diffTriggerRef.current = window.setTimeout(
                async () => {
                    const {
                        addedItems,
                        removedItems,
                        updatedItems,
                    } = getChangedItems<T>(
                        serverState,
                        localState,
                        (item) => item.clientId,
                    );

                    const sanitizedAddedItems = addedItems
                        .filter((item) => isNotDefined(item.id));
                    const sanitizedUpdatedItems = updatedItems
                        .filter((item) => isDefined(item.id));
                    const sanitizedDeletedItems = removedItems
                        .map((item) => item.id).filter(isDefined);

                    if (sanitizedAddedItems.length === 0
                        && sanitizedUpdatedItems.length === 0
                        && sanitizedDeletedItems.length === 0
                    ) {
                        // eslint-disable-next-line no-console
                        console.info('No change detected...');
                        return;
                    }

                    // eslint-disable-next-line no-console
                    console.info(`Changes detected! ${sanitizedAddedItems.length} added. ${sanitizedUpdatedItems.length} modified. ${sanitizedDeletedItems.length} deleted.`);
                    const res = await action(
                        sanitizedAddedItems,
                        sanitizedUpdatedItems,
                        sanitizedDeletedItems,
                    );

                    if (res.ok) {
                        setStateData(
                            (prevLocalState) => {
                                const updatedIds = listToMap(
                                    res.savedValues,
                                    (item) => item.clientId,
                                    (item) => item.id,
                                );
                                const newLocalState = prevLocalState?.map((item) => (
                                    isDefined(item.id)
                                        ? item
                                        : { ...item, id: updatedIds[item.clientId] }
                                ));

                                return newLocalState;
                            },
                            (prevServerState) => {
                                const newServerState = mergeList(
                                    prevServerState,
                                    res.savedValues,
                                    (item) => item.clientId,
                                );

                                const deletedItemsMapping = listToMap(
                                    res.deletedValues,
                                    (item) => item,
                                    () => true,
                                );
                                return newServerState.filter(
                                    (item) => !deletedItemsMapping[item.clientId],
                                );
                            },
                        );
                    } else {
                        // eslint-disable-next-line no-console
                        console.info('Error response from server.');
                    }
                },
                1000,
            );
        },
        [localState, serverState, action, setStateData],
    );

    const isObsolete = useMemo(() => {
        const {
            addedItems,
            removedItems,
            updatedItems,
        } = getChangedItems<T>(
            serverState,
            localState,
            (item) => item.clientId,
        );

        const sanitizedAddedItems = addedItems
            .filter((item) => isNotDefined(item.id));
        const sanitizedUpdatedItems = updatedItems
            .filter((item) => isDefined(item.id));
        const sanitizedDeletedItems = removedItems
            .map((item) => item.id).filter(isDefined);

        return sanitizedAddedItems.length !== 0
            || sanitizedUpdatedItems.length !== 0
            || sanitizedDeletedItems.length !== 0;
    }, [localState, serverState]);

    return useMemo(
        () => ({
            addOrUpdateServerData,
            addOrUpdateStateData: addOrUpdateLocalData,
            removeFromStateData,
            isObsolete,
        }),
        [addOrUpdateServerData, addOrUpdateLocalData, removeFromStateData, isObsolete],
    );
}

export default useBackgroundSync;
