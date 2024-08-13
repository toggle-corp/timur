import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useReducer,
} from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import {
    isDefined,
    isNotDefined,
    listToMap,
} from '@togglecorp/fujs';

import { getChangedItems, mergeList } from '#utils/common';

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
    value: SetAction<T[]>,
}

type Actions<T extends Base> = RemoveLocalStateItem | UpdateServerStateItems<T> | UpdateLocalStateItems<T> | SetCombinedState<T>

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
        }
    }
    if (action.type === 'UPDATE_LOCAL_STATE_ITEMS') {
        return {
            ...prevState,
            localState: mergeList(
                prevState.localState,
                action.value,
                (item) => item.clientId,
            ),
        }
    }
    if (action.type === 'SET_COMBINED_STATE') {
        const value = typeof action.value === 'function'
            ? action.value(prevState.localState)
            : action.value;
        return {
            ...prevState,
            localState: value,
            serverState: value,
        }
    }
    // eslint-disable-next-line no-console
    console.error('Action is not supported');
    return prevState;
};


function useBackgroundSync<T extends Base>(
    action: (
        addedItems: T[],
        updatedItems: T[],
        deletedItems: string[],
    ) => Promise<{ ok: true, values: { id: string, clientId: string }[] } | { ok: false }>,
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
    )

    const {
        localState,
        serverState,
    } = state;

    const [lastMutationOn, setLastMutationOn] = useState<number>();

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
        (value: SetAction<T[]>) => {
            const action: SetCombinedState<T> = {
                type: 'SET_COMBINED_STATE',
                value: value,
            };
            dispatch(action);
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

            console.log('Setting up trigger');
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
                    console.info('Changes detected! Syncing with server...');
                    // eslint-disable-next-line no-console
                    console.info(`${sanitizedAddedItems.length} added. ${sanitizedUpdatedItems.length} modified. ${sanitizedDeletedItems.length} deleted.`);
                    const res = await action(
                        sanitizedAddedItems,
                        sanitizedUpdatedItems,
                        sanitizedDeletedItems,
                    );

                    if (res.ok) {
                        const updatedIds = listToMap(
                            res.values,
                            (item) => item.clientId,
                            (item) => item.id,
                        );
                        unstable_batchedUpdates(() => {
                            setStateData((prevLocalState) => {
                                const newLocalState = prevLocalState?.map((item) => (
                                    isDefined(item.id)
                                        ? item
                                        : { ...item, id: updatedIds[item.clientId] }
                                ));
                                return newLocalState;
                            });
                            setLastMutationOn(new Date().getTime());
                        });
                    } else {
                        // eslint-disable-next-line no-console
                        console.info('Error response from server.');
                    }
                },
                2000,
            );
        },
        [localState, serverState, action],
    );

    return useMemo(
        () => ({
            addOrUpdateServerData,
            addOrUpdateStateData: addOrUpdateLocalData,
            removeFromStateData,
            lastMutationOn,
        }),
        [addOrUpdateServerData, addOrUpdateLocalData, removeFromStateData, lastMutationOn],
    );
}

export default useBackgroundSync;
