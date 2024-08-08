import {
    type Dispatch,
    type SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    IoAperture,
    IoChevronBackSharp,
    IoChevronDown,
    IoChevronForwardSharp,
    IoInformation,
} from 'react-icons/io5';
import {
    encodeDate,
    isDefined,
    isFalsyString,
    isNotDefined,
    listToGroupList,
    listToMap,
    mapToList,
    sum,
    unique,
} from '@togglecorp/fujs';
import {
    gql,
    useMutation,
    useQuery,
} from 'urql';

import Button from '#components/Button';
import Page from '#components/Page';
import RawInput from '#components/RawInput';
import EnumsContext from '#contexts/enums';
import FocusContext from '#contexts/focus';
import {
    MyTimeEntriesQuery,
    MyTimeEntriesQueryVariables,
} from '#generated/types/graphql';
import { useFocusManager } from '#hooks/useFocus';
import useKeybind from '#hooks/useKeybind';
import useLocalStorage from '#hooks/useLocalStorage';
import {
    addDays,
    getDurationString,
    getNewId,
} from '#utils/common';
import { removeNull } from '#utils/nullHelper';
import {
    EditingMode,
    EntriesAsList,
    Note,
    WorkItem,
    WorkItemStatus,
    WorkItemType,
} from '#utils/types';

import AddWorkItemDialog from './AddWorkItemDialog';
import DayView from './DayView';
import ShortcutsDialog from './ShortcutsDialog';
import UpdateNoteDialog from './UpdateNoteDialog';

import styles from './styles.module.css';

const { APP_VERSION } = import.meta.env;

const KEY_DATA_STORAGE = 'timur';

const dateFormatter = new Intl.DateTimeFormat(
    [],
    {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
    },
);

const emptyArray: unknown[] = [];

const MY_TIME_ENTRIES_QUERY = gql`
    query MyTimeEntries($date: Date!) {
        private {
            id
            myTimeEntries(date: $date) {
                clientId
                date
                description
                duration
                id
                startTime
                status
                taskId
                type
            }
        }
    }
`;

const BULK_TIME_ENTRY_MUTATION = gql`
    mutation BulkTimeEntry($timeEntries: [TimeEntryBulkCreateInput!], $deleteIds: [ID!]) {
        private {
            bulkTimeEntry(
                items: $timeEntries,
                deleteIds: $deleteIds
            ) {
                deleted {
                    clientId
                    id
                }
                errors
                results {
                    id
                }
            }
        }
    }
`;

function getChangedItems(
    initialItems: WorkItem[] | undefined,
    finalItems: WorkItem[] | undefined,
) {
    const initialKeysMap = listToMap(initialItems ?? [], ({ clientId }) => clientId ?? '??');
    const finalKeysMap = listToMap(finalItems ?? [], ({ clientId }) => clientId ?? '??');

    const addedKeys = Object.keys(finalKeysMap).filter(
        (key) => !initialKeysMap[key],
    );
    const removedKeys = Object.keys(initialKeysMap).filter(
        (key) => !finalKeysMap[key],
    );
    const updatedKeys = Object.keys(initialKeysMap).filter(
        (key) => {
            if (isNotDefined(finalKeysMap[key])) {
                return false;
            }

            const initialJson = JSON.stringify(initialKeysMap[key]);
            const finalJson = JSON.stringify(finalKeysMap[key]);

            return initialJson !== finalJson;
        },
    );

    return {
        addedItems: addedKeys.map((key) => finalKeysMap[key]),
        removedItems: removedKeys.map((key) => initialKeysMap[key]),
        updatedItems: updatedKeys.map((key) => finalKeysMap[key]),
    };
}

function useBackgroundSync() {
    const [dataFromServer, setDataFromServer] = useState<WorkItem[]>();
    const [dataFromState, setDataFromState] = useState<WorkItem[]>();
    const [lastMutationOn, setLastMutationOn] = useState<number>();

    const updateServerData = useCallback((workItems: WorkItem[] | undefined) => {
        setDataFromServer((prevData) => {
            const newData = unique(
                [...workItems ?? [], ...prevData ?? []],
                ({ clientId }) => clientId ?? '??',
            );

            return newData;
        });
    }, []);

    const updateStateData = useCallback((workItems: WorkItem[] | undefined) => {
        setDataFromState((prevData) => {
            const newData = unique(
                [...workItems ?? [], ...prevData ?? []],
                ({ clientId }) => clientId ?? '??',
            );

            return newData;
        });
    }, []);

    const removeStateData = useCallback((clientId: string | null | undefined) => {
        setDataFromState((prevData) => {
            if (!prevData) {
                return prevData;
            }
            const newData = [...prevData ?? []];
            const obsoleteIndex = newData?.findIndex((item) => item.clientId === clientId);

            if (obsoleteIndex !== -1) {
                newData.splice(obsoleteIndex, 1);
            }

            return newData;
        });
    }, []);

    const [bulkMutationState, triggerBulkMutation] = useMutation(BULK_TIME_ENTRY_MUTATION);

    const diffTriggerRef = useRef<number>();

    useEffect(() => {
        if (dataFromState === dataFromServer) {
            // eslint-disable-next-line no-console
            console.info('No changes detected...');
            return;
        }

        window.clearTimeout(diffTriggerRef.current);
        diffTriggerRef.current = window.setTimeout(
            async () => {
                const {
                    addedItems,
                    removedItems,
                    updatedItems,
                } = getChangedItems(dataFromServer, dataFromState);

                if (addedItems.length === 0
                    && removedItems.length === 0
                    && updatedItems.length === 0
                ) {
                    // eslint-disable-next-line no-console
                    console.info('No changes detected...');
                    return;
                }

                // eslint-disable-next-line no-console
                console.info('Changes detected! Syncing with server...');
                const bulkMutationResponse = await triggerBulkMutation({
                    timeEntries: [
                        ...addedItems,
                        ...updatedItems,
                    ],
                    deleteIds: removedItems.map(({ id }) => id),
                });

                if (!bulkMutationResponse.error) {
                    setLastMutationOn(new Date().getTime());
                    setDataFromServer(dataFromState);
                }
            },
            2000,
        );
    }, [dataFromState, dataFromServer, triggerBulkMutation]);

    return useMemo(() => ({
        updateServerData,
        updateStateData,
        removeStateData,
        bulkMutationState,
        lastMutationOn,
    }), [updateServerData, updateStateData, removeStateData, bulkMutationState, lastMutationOn]);
}

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [workItems, setWorkItems] = useState<WorkItem[]>([]);
    const { taskById } = useContext(EnumsContext);
    const {
        updateStateData,
        updateServerData,
        removeStateData,
        bulkMutationState,
        lastMutationOn,
    } = useBackgroundSync();

    const [storedState, setStoredState] = useLocalStorage<{
        appVersion: string,
        notes: Note[]

        configDefaultTaskType: WorkItemType,
        configDefaultTaskStatus: WorkItemStatus,
        configAllowMultipleEntry: boolean,
        configEditingMode: EditingMode,
        configFocusMode: boolean,
    }>(
        KEY_DATA_STORAGE,
        {
            appVersion: APP_VERSION,
            notes: [],
            configDefaultTaskType: 'DEVELOPMENT',
            configDefaultTaskStatus: 'DONE',
            configAllowMultipleEntry: false,
            configEditingMode: 'normal',
            configFocusMode: false,
        },
    );

    const {
        focus,
        register,
        unregister,
    } = useFocusManager();

    // NOTE: We cannot put this outside the component.
    const today = new Date();

    const [
        selectedDate,
        setSelectedDate,
    ] = useState<string>(
        () => encodeDate(today),
    );

    // NOTE: We are hiding the native dateinput and triggering calender popup
    // using a separate button
    const dateInputRef = useRef<HTMLInputElement>(null);
    // NOTE: We are opening the dialog from this parent component
    const dialogOpenTriggerRef = useRef<(() => void) | undefined>();
    const noteDialogOpenTriggerRef = useRef<(() => void) | undefined>();
    const shortcutsDialogOpenTriggerRef = useRef<(() => void) | undefined>();

    // Read state from the stored state
    const notes = storedState.notes ?? emptyArray;
    const configDefaultTaskType = storedState.configDefaultTaskType ?? 'development';
    const configDefaultTaskStatus = storedState.configDefaultTaskStatus ?? 'done';
    const configAllowMultipleEntry = storedState.configAllowMultipleEntry ?? false;
    const configEditingMode = storedState.configEditingMode ?? 'normal';
    const configFocusMode = storedState.configFocusMode ?? false;

    const setDefaultTaskType: Dispatch<SetStateAction<WorkItemType>> = useCallback(
        (func) => {
            setStoredState((oldValue) => ({
                ...oldValue,
                configDefaultTaskType: typeof func === 'function'
                    ? func(oldValue.configDefaultTaskType)
                    : func,
            }));
        },
        [setStoredState],
    );
    const setDefaultTaskStatus: Dispatch<SetStateAction<WorkItemStatus>> = useCallback(
        (func) => {
            setStoredState((oldValue) => ({
                ...oldValue,
                configDefaultTaskStatus: typeof func === 'function'
                    ? func(oldValue.configDefaultTaskStatus)
                    : func,
            }));
        },
        [setStoredState],
    );
    const setAllowMultipleEntryChange: Dispatch<SetStateAction<boolean>> = useCallback(
        (func) => {
            setStoredState((oldValue) => ({
                ...oldValue,
                configAllowMultipleEntry: typeof func === 'function'
                    ? func(oldValue.configAllowMultipleEntry)
                    : func,
            }));
        },
        [setStoredState],
    );
    const setEditingModeChange: Dispatch<SetStateAction<EditingMode>> = useCallback(
        (func) => {
            setStoredState((oldValue) => ({
                ...oldValue,
                configEditingMode: typeof func === 'function'
                    ? func(oldValue.configEditingMode)
                    : func,
            }));
        },
        [setStoredState],
    );
    const setFocusModeChange: Dispatch<SetStateAction<boolean>> = useCallback(
        (func) => {
            setStoredState((oldValue) => ({
                ...oldValue,
                configFocusMode: typeof func === 'function'
                    ? func(oldValue.configFocusMode)
                    : func,
            }));
        },
        [setStoredState],
    );
    const setNotes: Dispatch<SetStateAction<Note[]>> = useCallback(
        (func) => {
            setStoredState((oldValue) => ({
                ...oldValue,
                notes: typeof func === 'function'
                    ? func(oldValue.notes)
                    : func,
            }));
        },
        [setStoredState],
    );

    const [myTimeEntriesResult] = useQuery<MyTimeEntriesQuery, MyTimeEntriesQueryVariables>({
        query: MY_TIME_ENTRIES_QUERY,
        variables: { date: selectedDate },
    });

    useEffect(() => {
        const workItemsFromServer = removeNull(
            myTimeEntriesResult.data?.private.myTimeEntries?.map(
                (timeEntry) => {
                    const { taskId, ...otherTimeEntryProps } = timeEntry;

                    return {
                        ...otherTimeEntryProps,
                        task: taskId,
                    };
                },
            ) ?? [],
        );

        setWorkItems(workItemsFromServer);
        updateServerData(workItemsFromServer);
        updateStateData(workItemsFromServer);
    }, [myTimeEntriesResult, setWorkItems, updateServerData, updateStateData]);

    const currentNote = useMemo(
        () => (
            notes.find(({ date }) => date === selectedDate)
        ),
        [notes, selectedDate],
    );

    const handleDateSelection = useCallback(
        (value: string | undefined) => {
            // NOTE: We do not reset selected date
            if (value) {
                setSelectedDate(value);
            }
        },
        [],
    );

    const handleTodaySelection = useCallback(
        () => {
            setSelectedDate(encodeDate(new Date()));
        },
        [],
    );

    const handleWorkItemCreate = useCallback(
        (taskId: string) => {
            const newId = getNewId();
            const newItem = {
                clientId: newId,
                task: taskId,
                type: configDefaultTaskType,
                status: configDefaultTaskStatus,
                date: selectedDate,
            } satisfies WorkItem;

            setWorkItems((oldWorkItems = []) => ([
                ...oldWorkItems,
                newItem,
            ]));

            updateStateData([newItem]);

            focus(String(newId));
        },
        [
            setWorkItems,
            selectedDate,
            configDefaultTaskType,
            configDefaultTaskStatus,
            focus,
            updateStateData,
        ],
    );

    const handleWorkItemClone = useCallback(
        (workItemClientId: string) => {
            const newId = getNewId();
            setWorkItems((oldWorkItems) => {
                if (isNotDefined(oldWorkItems)) {
                    return oldWorkItems;
                }

                const sourceItemIndex = oldWorkItems
                    .findIndex(({ clientId }) => workItemClientId === clientId);
                if (sourceItemIndex === -1) {
                    return oldWorkItems;
                }

                const targetItem = {
                    ...oldWorkItems[sourceItemIndex],
                    id: newId,
                    description: undefined,
                    hours: undefined,
                };

                const newWorkItems = [...oldWorkItems];
                newWorkItems.splice(sourceItemIndex + 1, 0, targetItem);
                updateStateData(newWorkItems);

                return newWorkItems;
            });
            focus(String(newId));
        },
        [setWorkItems, focus, updateStateData],
    );

    const handleWorkItemDelete = useCallback(
        (workItemClientId: string) => {
            setWorkItems((oldWorkItems) => {
                if (isNotDefined(oldWorkItems)) {
                    return oldWorkItems;
                }

                const sourceItemIndex = oldWorkItems
                    .findIndex(({ clientId }) => workItemClientId === clientId);
                if (sourceItemIndex === -1) {
                    return oldWorkItems;
                }

                const removedItem = oldWorkItems[sourceItemIndex];
                removeStateData(removedItem.clientId);

                const newWorkItems = [...oldWorkItems];
                newWorkItems.splice(sourceItemIndex, 1);

                return newWorkItems;
            });
        },
        [setWorkItems, removeStateData],
    );

    const handleWorkItemChange = useCallback(
        (workItemClientId: string, ...entries: EntriesAsList<WorkItem>) => {
            setWorkItems((oldWorkItems) => {
                if (isNotDefined(oldWorkItems)) {
                    return oldWorkItems;
                }

                const sourceItemIndex = oldWorkItems
                    .findIndex(({ clientId }) => workItemClientId === clientId);

                if (sourceItemIndex === -1) {
                    return oldWorkItems;
                }

                const obsoleteWorkItem = oldWorkItems[sourceItemIndex];

                const newWorkItem = {
                    ...obsoleteWorkItem,
                    [entries[1]]: entries[0],
                };

                if (
                    isDefined(newWorkItem.duration)
                    && newWorkItem.duration > 0
                    && obsoleteWorkItem.duration !== newWorkItem.duration
                    && newWorkItem.status === 'TODO'
                ) {
                    newWorkItem.status = 'DOING';
                }

                updateStateData([newWorkItem]);

                const newWorkItems = [...oldWorkItems];

                newWorkItems.splice(
                    sourceItemIndex,
                    1,
                    newWorkItem,
                );

                return newWorkItems;
            });
        },
        [setWorkItems, updateStateData],
    );

    const handleNoteCreate = useCallback(
        () => {
            setNotes((oldNotes = []) => {
                if (oldNotes.find((note) => note.date === selectedDate)) {
                    return oldNotes;
                }
                return [
                    ...oldNotes,
                    {
                        id: getNewId(),
                        date: selectedDate,
                        content: '',
                    },
                ];
            });
        },
        [setNotes, selectedDate],
    );

    const handleNoteUpdate = useCallback(
        (content: string | undefined, noteId: string | undefined) => {
            setNotes((oldNotes = []) => {
                if (!noteId) {
                    // eslint-disable-next-line no-console
                    console.error('Could not find note to update');
                    return oldNotes;
                }

                const sourceItemIndex = oldNotes
                    .findIndex(({ id }) => noteId === id);
                if (sourceItemIndex === -1) {
                    // eslint-disable-next-line no-console
                    console.error('Could not find note to update');
                    return oldNotes;
                }

                const prevNote = oldNotes[sourceItemIndex];
                const newWorkItems = [...oldNotes];
                newWorkItems.splice(
                    sourceItemIndex,
                    1,
                    {
                        ...prevNote,
                        content,
                    },
                );

                return newWorkItems;
            });
        },
        [setNotes],
    );

    const handleCopyTextButtonClick = useCallback(
        () => {
            function toSubItem(workItem: WorkItem) {
                const description = workItem.description ?? '??';
                const status = (workItem.status ?? 'todo' satisfies WorkItemStatus);

                return description
                    .split('\n')
                    .map((item, i) => ([
                        i === 0 ? '  -' : '   ',
                        status !== 'DONE' ? `\`${status.toUpperCase()}\`` : undefined,
                        i === 0 ? `${workItem.task.title}: ${item}` : item,
                    ].filter(isDefined).join(' ')))
                    .join('\n');
            }

            if (isNotDefined(taskById)) {
                return;
            }

            const groupedWorkItems = mapToList(listToGroupList(
                workItems,
                (workItem) => taskById[workItem.task].contract.project.id,
                undefined,
                (list) => ({
                    project: taskById?.[list[0].task].contract.project,
                    workItems: list,
                }),
            ));

            const text = groupedWorkItems.map((projectGrouped) => {
                const { project, workItems: projectWorkItems } = projectGrouped;

                return `- ${project.title}\n${projectWorkItems.map((workItem) => toSubItem(workItem)).join('\n')}`;
            }).join('\n');

            if (isFalsyString(text)) {
                return;
            }

            console.log(text);

            window.navigator.clipboard.writeText(text);
        },
        [workItems, taskById],
    );

    const handleDateButtonClick = useCallback(
        () => {
            dateInputRef.current?.showPicker();
        },
        [],
    );

    const handleWorkItemAddClick = useCallback(
        () => {
            if (dialogOpenTriggerRef.current) {
                dialogOpenTriggerRef.current();
            }
        },
        [],
    );

    const handleNoteUpdateClick = useCallback(
        () => {
            handleNoteCreate();
            if (noteDialogOpenTriggerRef.current) {
                noteDialogOpenTriggerRef.current();
            }
        },
        [handleNoteCreate],
    );

    const handleShortcutsButtonClick = useCallback(
        () => {
            if (shortcutsDialogOpenTriggerRef.current) {
                shortcutsDialogOpenTriggerRef.current();
            }
        },
        [],
    );

    const handleKeybindingsPress = useCallback(
        (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === ' ') {
                handleWorkItemAddClick();
                event.preventDefault();
                event.stopPropagation();
            } else if (event.ctrlKey && event.key === 'Enter') {
                handleNoteUpdateClick();
                event.preventDefault();
                event.stopPropagation();
            } else if (event.ctrlKey && event.shiftKey && event.key === 'ArrowLeft') {
                setSelectedDate((value) => addDays(value, -1));
                event.preventDefault();
                event.stopPropagation();
            } else if (event.ctrlKey && event.shiftKey && event.key === 'ArrowRight') {
                setSelectedDate((value) => addDays(value, 1));
                event.preventDefault();
                event.stopPropagation();
            } else if (event.ctrlKey && event.shiftKey && event.key === 'ArrowDown') {
                setSelectedDate(encodeDate(new Date()));
                event.preventDefault();
                event.stopPropagation();
            } else if (event.ctrlKey && event.shiftKey && event.key === 'F') {
                setFocusModeChange((oldVal) => !oldVal);
                event.preventDefault();
                event.stopPropagation();
            } else if (event.ctrlKey && event.shiftKey && event.key === '?') {
                handleShortcutsButtonClick();
                event.preventDefault();
                event.stopPropagation();
            }
        },
        [
            handleWorkItemAddClick,
            handleNoteUpdateClick,
            setFocusModeChange,
            handleShortcutsButtonClick,
        ],
    );

    useKeybind(handleKeybindingsPress);

    const formattedDate = dateFormatter.format(
        selectedDate ? new Date(selectedDate) : undefined,
    );

    const totalHours = useMemo(
        () => (
            sum(workItems.map((item) => item.duration).filter(isDefined))
        ),
        [workItems],
    );

    const focusContextValue = useMemo(
        () => ({
            register,
            unregister,
        }),
        [register, unregister],
    );

    return (
        <Page
            documentTitle="Timur - Home"
            className={styles.home}
            contentClassName={styles.content}
        >
            {bulkMutationState.fetching && myTimeEntriesResult.fetching && (
                <div className={styles.uiBlocker}>
                    Loading...
                </div>
            )}
            <div className={styles.pageHeader}>
                <div className={styles.headerContent}>
                    <Button
                        name={addDays(selectedDate, -1)}
                        onClick={handleDateSelection}
                        variant="secondary"
                        title="Previous day"
                        spacing="sm"
                    >
                        <IoChevronBackSharp />
                    </Button>
                    <Button
                        name={addDays(selectedDate, 1)}
                        onClick={handleDateSelection}
                        variant="secondary"
                        title="Next day"
                        spacing="sm"
                    >
                        <IoChevronForwardSharp />
                    </Button>
                    <Button
                        name={undefined}
                        onClick={handleTodaySelection}
                        variant="secondary"
                        disabled={selectedDate === encodeDate(today)}
                        spacing="sm"
                    >
                        Today
                    </Button>
                </div>
                <div className={styles.actions}>
                    <div className={styles.lastSavedStatus}>
                        Last saved:
                        {' '}
                        <strong>
                            {lastMutationOn ? new Date(lastMutationOn).toLocaleString() : 'Never'}
                        </strong>
                    </div>
                    <Button
                        name={!configFocusMode}
                        onClick={setFocusModeChange}
                        variant={configFocusMode ? 'primary' : 'secondary'}
                        title={configFocusMode ? 'Disable focus mode' : 'Enable focus mode'}
                        spacing="sm"
                    >
                        <IoAperture />
                    </Button>
                    <Button
                        name
                        onClick={handleShortcutsButtonClick}
                        variant="secondary"
                        title="Open shortcuts"
                        spacing="sm"
                    >
                        <IoInformation />
                    </Button>
                </div>
            </div>
            <div className={styles.dayHeader}>
                <div className={styles.headerContent}>
                    <div className={styles.dateContainer}>
                        <RawInput
                            elementRef={dateInputRef}
                            type="date"
                            className={styles.dateInput}
                            name={undefined}
                            value={selectedDate}
                            onChange={handleDateSelection}
                        />
                        <Button
                            className={styles.dateButton}
                            actionsContainerClassName={styles.buttonActions}
                            name={undefined}
                            variant="tertiary"
                            onClick={handleDateButtonClick}
                            actions={<IoChevronDown />}
                        >
                            {formattedDate}
                        </Button>
                    </div>
                    {!configFocusMode && (
                        <div className={styles.duration}>
                            ⏱️
                            {' '}
                            {getDurationString(totalHours)}
                        </div>
                    )}
                </div>
                <div className={styles.actions}>
                    <Button
                        name={undefined}
                        onClick={handleCopyTextButtonClick}
                        variant="secondary"
                        disabled={workItems.length === 0}
                    >
                        Copy standup text
                    </Button>
                    <Button
                        name
                        onClick={handleNoteUpdateClick}
                        variant="secondary"
                    >
                        {currentNote && !!currentNote.content
                            ? 'Edit notes'
                            : 'Add notes'}
                    </Button>
                    <Button
                        name
                        onClick={handleWorkItemAddClick}
                    >
                        Add entry
                    </Button>
                </div>
            </div>
            <FocusContext.Provider
                value={focusContextValue}
            >
                <DayView
                    workItems={workItems}
                    onWorkItemClone={handleWorkItemClone}
                    onWorkItemChange={handleWorkItemChange}
                    onWorkItemDelete={handleWorkItemDelete}
                    focusMode={configFocusMode}
                />
            </FocusContext.Provider>
            <ShortcutsDialog
                dialogOpenTriggerRef={shortcutsDialogOpenTriggerRef}
            />
            <UpdateNoteDialog
                dialogOpenTriggerRef={noteDialogOpenTriggerRef}
                note={currentNote}
                onNoteContentUpdate={handleNoteUpdate}
                editingMode={configEditingMode}
                onEditingModeChange={setEditingModeChange}
            />
            <AddWorkItemDialog
                dialogOpenTriggerRef={dialogOpenTriggerRef}
                workItems={workItems}
                onWorkItemCreate={handleWorkItemCreate}
                defaultTaskType={configDefaultTaskType}
                onDefaultTaskTypeChange={setDefaultTaskType}
                defaultTaskStatus={configDefaultTaskStatus}
                onDefaultTaskStatusChange={setDefaultTaskStatus}
                allowMultipleEntry={configAllowMultipleEntry}
                onAllowMultipleEntryChange={setAllowMultipleEntryChange}
            />
        </Page>
    );
}

Component.displayName = 'Home';
