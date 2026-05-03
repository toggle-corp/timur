import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    gql,
    useMutation,
} from 'urql';

import CommandContext, { CommandContextProps } from '#contexts/command';
import {
    CudTimeEntryMutation,
    CudTimeEntryMutationVariables,
} from '#generated/types/graphql';
import {
    AddCommand,
    Command,
    DeleteCommand,
    EditCommand,
} from '#utils/command';
import { WorkItem } from '#utils/types';

const CUD_TIME_ENTRY_MUTATION = gql`
    mutation CudTimeEntry(
        $createItems: [TimeEntryBulkCreateInput!],
        $updateItems: [TimeEntryBulkUpdateInput!],
        $deleteIds: [ID!],
    ) {
        private {
            cudTimeEntry(
                createItems: $createItems,
                updateItems: $updateItems,
                deleteIds: $deleteIds
            ) {
                deleted {
                    id
                    clientId
                }
                errors
                createItems {
                    id
                    clientId
                    date
                    description
                    duration
                    startTime
                    status
                    taskId
                    type
                }
                updateItems {
                    id
                    clientId
                    date
                    description
                    duration
                    startTime
                    status
                    taskId
                    type
                }
            }
        }
    }
`;

function isAddAction<T, K>(item: Command<T, K>): item is AddCommand<T, K> {
    return item.type === 'add';
}

function isEditAction<T, K>(item: Command<T, K>): item is EditCommand<T, K> {
    return item.type === 'edit';
}
function isDeleteAction<T, K>(item: Command<T, K>): item is DeleteCommand<T, K> {
    return item.type === 'delete';
}

interface BaseProps {
    children: React.ReactNode;
}

function CommandProvider(props: BaseProps) {
    const { children } = props;

    const zeitgeist = useRef<number>(0);
    const commands = useRef<Command<WorkItem, string>[]>([]);
    const [undoable, setUndobale] = useState(false);
    const [redoable, setRedoable] = useState(false);
    const setCommands = useCallback(
        (value: Command<WorkItem, string>[]) => {
            commands.current = value;
            const forwardSpace = commands.current.length - zeitgeist.current;
            setRedoable(forwardSpace > 0);
            const backwardSpace = zeitgeist.current;
            setUndobale(backwardSpace > 0);
        },
        [],
    );

    const serverCommands = useRef<Command<WorkItem, string>[]>([]);
    const [
        serverCommandsLastUpdated,
        setServerCommandsLastUpdated,
    ] = useState<number | undefined>(undefined);
    const setServerCommands = useCallback(
        (value: Command<WorkItem, string>[]) => {
            serverCommands.current = value;
            if (serverCommands.current.length === 0) {
                setServerCommandsLastUpdated(undefined);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const val = serverCommands.current[serverCommands.current.length - 1]!.timestamp;
                setServerCommandsLastUpdated(val);
            }
        },
        [],
    );

    const inFlightServerCommands = useRef<Command<WorkItem, string>[]>([]);
    const [inFlight, setInFlight] = useState(false);

    const [
        ,
        triggerCudTimeEntryMutation,
    ] = useMutation<CudTimeEntryMutation, CudTimeEntryMutationVariables>(
        CUD_TIME_ENTRY_MUTATION,
    );

    useEffect(
        () => {
            if (inFlight || !serverCommandsLastUpdated) {
                return;
            }

            if (serverCommands.current.length === 0) {
                return;
            }

            inFlightServerCommands.current = serverCommands.current.slice(0, 20);
            setServerCommands(serverCommands.current.slice(20));

            setInFlight(true);

            async function mutate() {
                try {
                    const addedItems = inFlightServerCommands.current.filter(isAddAction);
                    const editedItems = inFlightServerCommands.current.filter(isEditAction);
                    const deletedItems = inFlightServerCommands.current.filter(isDeleteAction);
                    const res = await triggerCudTimeEntryMutation({
                        createItems: addedItems.map((item) => item.newValue),
                        updateItems: editedItems.map((item) => {
                            const finalItem = {
                                ...item.newValue,
                                clientId: item.key,
                            };
                            // NOTE: We want to replace all undefined with null so that
                            // we can indicate to server that the fields should be cleared
                            Object.entries(finalItem).forEach(([field, value]) => {
                                finalItem[field as keyof typeof finalItem] = value ?? null;
                            });
                            return finalItem;
                        }),
                        deleteIds: deletedItems.map((item) => item.oldValue.clientId),
                    });

                    // eslint-disable-next-line no-console
                    console.debug(res);
                } catch (ex) {
                    setServerCommands([
                        ...inFlightServerCommands.current,
                        ...serverCommands.current,
                    ]);
                }
                inFlightServerCommands.current = [];
                setInFlight(false);
            }

            // NOTE: This will act as a rate limit
            setTimeout(
                mutate,
                1000,
            );
        },
        [inFlight, serverCommandsLastUpdated, setServerCommands, triggerCudTimeEntryMutation],
    );

    const setZeitgeist = useCallback(
        (value: number) => {
            zeitgeist.current = value;
            const forwardSpace = commands.current.length - zeitgeist.current;
            setRedoable(forwardSpace > 0);
            const backwardSpace = zeitgeist.current;
            setUndobale(backwardSpace > 0);
        },
        [],
    );

    const watch = useCallback(
        (action: Command<WorkItem, string>) => {
            const oldActions = serverCommands.current;
            const existingActionIndex = oldActions.findIndex((item) => item.key === action.key);
            if (existingActionIndex === -1) {
                setServerCommands([...oldActions, action]);
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const existingAction = oldActions[existingActionIndex]!;
            const newActions = [...oldActions];
            if (existingAction.type === 'add' && action.type === 'delete') {
                // we remove from list
                newActions.splice(existingActionIndex, 1);
            } else if (existingAction.type === 'add' && action.type === 'edit') {
                // we update the add
                newActions.splice(
                    existingActionIndex,
                    1,
                    {
                        ...existingAction,
                        timestamp: action.timestamp,
                        newValue: {
                            ...existingAction.newValue,
                            ...action.newValue,
                        },
                    },
                );
            } else if (existingAction.type === 'edit' && action.type === 'edit') {
                // we update the edit
                newActions.splice(
                    existingActionIndex,
                    1,
                    {
                        ...existingAction,
                        timestamp: action.timestamp,
                        newValue: {
                            ...existingAction.newValue,
                            ...action.newValue,
                        },
                    },
                );
            } else if (existingAction.type === 'edit' && action.type === 'delete') {
                // we replace with delete
                newActions.splice(
                    existingActionIndex,
                    1,
                    action,
                );
            } else if (existingAction.type === 'delete' && action.type === 'add') {
                // we remove from list
                newActions.splice(
                    existingActionIndex,
                    1,
                );
            } else {
                // eslint-disable-next-line no-console
                console.error(`We previously had ${existingAction.type} but then we got ${action.type}`);
            }
            setServerCommands(newActions);
        },
        [setServerCommands],
    );

    const commandState = useMemo((): CommandContextProps => ({
        commands,
        zeitgeist,
        setZeitgeist,
        setCommands,
        watch,
        undoable,
        redoable,
        inFlight,
    }), [watch, setZeitgeist, setCommands, undoable, redoable, inFlight]);

    return (
        <CommandContext.Provider value={commandState}>
            {children}
        </CommandContext.Provider>
    );
}

export default CommandProvider;
