import {
    useCallback,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { FcClock } from 'react-icons/fc';
import { IoChevronDown } from 'react-icons/io5';
import {
    _cs,
    compareStringAsNumber,
    encodeDate,
    isDefined,
    isNotDefined,
    sum,
} from '@togglecorp/fujs';
import {
    gql,
    useMutation,
    useQuery,
} from 'urql';

import Button from '#components/Button';
import Page from '#components/Page';
import RawInput from '#components/RawInput';
import FocusContext from '#contexts/focus';
import {
    BulkTimeEntryMutation,
    BulkTimeEntryMutationVariables,
    MyTimeEntriesQuery,
    MyTimeEntriesQueryVariables,
} from '#generated/types/graphql';
import useBackgroundSync from '#hooks/useBackgroundSync';
import { useFocusManager } from '#hooks/useFocus';
import useKeybind from '#hooks/useKeybind';
import useLocalStorage from '#hooks/useLocalStorage';
import {
    addDays,
    getDurationString,
    getNewId,
} from '#utils/common';
import {
    defaultConfigValue,
    KEY_CONFIG_STORAGE,
} from '#utils/constants';
import { removeNull } from '#utils/nullHelper';
import {
    ConfigStorage,
    EntriesAsList,
    WorkItem,
} from '#utils/types';

import timurLogo from '../../App/icon.svg';
import AddWorkItemDialog from './AddWorkItemDialog';
import DayView from './DayView';
import ShortcutsDialog from './ShortcutsDialog';
import StartSidebar from './StartSidebar';

import styles from './styles.module.css';

const dateFormatter = new Intl.DateTimeFormat(
    [],
    {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
    },
);

const MY_TIME_ENTRIES_QUERY = gql`
    query MyTimeEntries($date: Date!) {
        private {
            id
            myTimeEntries(date: $date) {
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
`;

const BULK_TIME_ENTRY_MUTATION = gql`
    mutation BulkTimeEntry($timeEntries: [TimeEntryBulkCreateInput!], $deleteIds: [ID!]) {
        private {
            bulkTimeEntry(
                items: $timeEntries,
                deleteIds: $deleteIds
            ) {
                deleted {
                    id
                    clientId
                }
                errors
                results {
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

// TODO: Do not use JSON.stringify for comparison
// TODO: use filtered localState instead of workItems
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [workItems, setWorkItems] = useState<WorkItem[]>([]);

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
    // const noteDialogOpenTriggerRef = useRef<(() => void) | undefined>();
    const shortcutsDialogOpenTriggerRef = useRef<(() => void) | undefined>();

    /*
    const [storedData, setStoredDataState] = useLocalStorage<{
        appVersion: string,
        notes: Note[]
    }>(
        KEY_DATA_STORAGE,
        {
            appVersion: APP_VERSION,
            notes: [],
        },
    );
    */

    const [storedConfig, setStoredConfig] = useLocalStorage<ConfigStorage>(
        KEY_CONFIG_STORAGE,
        defaultConfigValue,
    );

    // Read state from the stored state
    // const notes = storedData.notes ?? emptyArray;

    /*
    const setNotes: Dispatch<SetStateAction<Note[]>> = useCallback(
        (func) => {
            setStoredDataState((oldValue) => ({
                ...oldValue,
                notes: typeof func === 'function'
                    ? func(oldValue.notes)
                    : func,
            }));
        },
        [setStoredDataState],
    );
    */

    const [
        bulkMutationState,
        triggerBulkMutation,
    ] = useMutation<BulkTimeEntryMutation, BulkTimeEntryMutationVariables>(
        BULK_TIME_ENTRY_MUTATION,
    );

    const handleBulkAction = useCallback(
        async (addedItems: WorkItem[], updatedItems: WorkItem[], removedItems: string[]) => {
            const res = await triggerBulkMutation({
                timeEntries: [
                    ...addedItems,
                    ...updatedItems,
                ],
                deleteIds: removedItems,
            });
            if (res.error) {
                return { ok: false } as const;
            }

            const workItemsFromServer = removeNull(
                res.data?.private.bulkTimeEntry.results?.map(
                    (timeEntry) => {
                        const { taskId, ...otherTimeEntryProps } = timeEntry;
                        return {
                            ...otherTimeEntryProps,
                            task: taskId,
                        };
                    },
                ) ?? [],
            );

            return {
                ok: true as const,
                savedValues: workItemsFromServer ?? [],
                deletedValues: res.data?.private.bulkTimeEntry.deleted?.map(
                    (item) => item.clientId,
                ) ?? [],
            } as const;
        },
        [triggerBulkMutation],
    );

    const {
        addOrUpdateStateData,
        removeFromStateData,
        addOrUpdateServerData,
        isObsolete,
    } = useBackgroundSync<WorkItem>(
        handleBulkAction,
    );

    const [
        myTimeEntriesResult,
    ] = useQuery<MyTimeEntriesQuery, MyTimeEntriesQueryVariables>({
        query: MY_TIME_ENTRIES_QUERY,
        variables: { date: selectedDate },
    });

    const prevCountRef = useRef<boolean>(myTimeEntriesResult.fetching);
    useLayoutEffect(
        () => {
            const previousFetching = prevCountRef.current;
            prevCountRef.current = myTimeEntriesResult.fetching;

            if (myTimeEntriesResult.fetching === previousFetching) {
                return;
            }
            if (myTimeEntriesResult.fetching) {
                return;
            }
            if (myTimeEntriesResult.error) {
                setWorkItems([]);
                return;
            }

            const workItemsFromServer = removeNull(
                myTimeEntriesResult.data?.private.myTimeEntries?.map(
                    (timeEntry) => {
                        const { taskId, ...otherTimeEntryProps } = timeEntry;
                        return {
                            ...otherTimeEntryProps,
                            task: taskId,
                        };
                    },
                ).sort((foo, bar) => compareStringAsNumber(foo.id, bar.id)) ?? [],
            );

            setWorkItems(workItemsFromServer);
            addOrUpdateServerData(workItemsFromServer);
            addOrUpdateStateData(workItemsFromServer);
        },
        [
            myTimeEntriesResult.fetching,
            myTimeEntriesResult.data,
            myTimeEntriesResult.error,
            setWorkItems,
            addOrUpdateServerData,
            addOrUpdateStateData,
        ],
    );

    /*
    const currentNote = useMemo(
        () => (
            notes.find(({ date }) => date === selectedDate)
        ),
        [notes, selectedDate],
    );
    */

    const handleWorkItemCreate = useCallback(
        (taskId: string) => {
            const newId = getNewId();
            const newItem: WorkItem = {
                clientId: newId,
                task: taskId,
                type: storedConfig.defaultTaskType,
                status: storedConfig.defaultTaskStatus,
                date: selectedDate,
            };

            setWorkItems((oldWorkItems = []) => ([
                ...oldWorkItems,
                newItem,
            ]));
            addOrUpdateStateData([newItem]);

            focus(String(newId));
        },
        [
            setWorkItems,
            selectedDate,
            storedConfig.defaultTaskStatus,
            storedConfig.defaultTaskType,
            focus,
            addOrUpdateStateData,
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
                    id: undefined,
                    clientId: newId,
                    description: undefined,
                    hours: undefined,
                };

                const newWorkItems = [...oldWorkItems];
                newWorkItems.splice(sourceItemIndex + 1, 0, targetItem);
                addOrUpdateStateData(newWorkItems);

                return newWorkItems;
            });
            focus(String(newId));
        },
        [setWorkItems, focus, addOrUpdateStateData],
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
                removeFromStateData(removedItem.clientId);

                const newWorkItems = [...oldWorkItems];
                newWorkItems.splice(sourceItemIndex, 1);

                return newWorkItems;
            });
        },
        [setWorkItems, removeFromStateData],
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

                addOrUpdateStateData([newWorkItem]);

                const newWorkItems = [...oldWorkItems];

                newWorkItems.splice(
                    sourceItemIndex,
                    1,
                    newWorkItem,
                );

                return newWorkItems;
            });
        },
        [setWorkItems, addOrUpdateStateData],
    );

    /*
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
    */

    /*
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
    */

    const handleDateButtonClick = useCallback(
        () => {
            dateInputRef.current?.showPicker();
        },
        [],
    );

    const handleAddEntryClick = useCallback(
        () => {
            if (dialogOpenTriggerRef.current) {
                dialogOpenTriggerRef.current();
            }
        },
        [],
    );

    /*
    const handleNoteUpdateClick = useCallback(
        () => {
            handleNoteCreate();
            if (noteDialogOpenTriggerRef.current) {
                noteDialogOpenTriggerRef.current();
            }
        },
        [handleNoteCreate],
    );
    */

    const handleShortcutsButtonClick = useCallback(
        () => {
            if (shortcutsDialogOpenTriggerRef.current) {
                shortcutsDialogOpenTriggerRef.current();
            }
        },
        [],
    );

    const toggleFocusMode = useCallback(() => {
        setStoredConfig((oldConfig) => ({
            ...oldConfig,
            focusMode: !oldConfig.focusMode,
        }));
    }, [setStoredConfig]);

    const handleKeybindingsPress = useCallback(
        (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === ' ') {
                handleAddEntryClick();
                event.preventDefault();
                event.stopPropagation();
            } else if (event.ctrlKey && event.key === 'Enter') {
                // handleNoteUpdateClick();
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
                toggleFocusMode();
                event.preventDefault();
                event.stopPropagation();
            } else if (event.ctrlKey && event.shiftKey && event.key === '?') {
                handleShortcutsButtonClick();
                event.preventDefault();
                event.stopPropagation();
            }
        },
        [
            handleAddEntryClick,
            // handleNoteUpdateClick,
            toggleFocusMode,
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

    const handleDateSelection = useCallback(
        (newDate: string | undefined) => {
            if (isDefined(newDate)) {
                setSelectedDate(newDate);
            }
        },
        [setSelectedDate],
    );

    return (
        <Page
            documentTitle="Timur - Home"
            className={styles.home}
            contentClassName={styles.content}
            startAsideContainerClassName={styles.startAside}
            startAsideContent={(
                <StartSidebar
                    workItems={workItems}
                    onAddEntryClick={handleAddEntryClick}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                />
            )}
        >
            <div
                className={_cs(
                    styles.lastSavedStatus,
                    (isObsolete || bulkMutationState.fetching) && styles.active,
                )}
            >
                <img
                    className={styles.timurIcon}
                    alt="Timur Icon"
                    src={timurLogo}
                />
                <div>
                    Syncing...
                </div>
            </div>
            <div className={styles.dayHeader}>
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
                {!storedConfig.focusMode && (
                    <div className={styles.duration}>
                        <FcClock />
                        <div>
                            {getDurationString(totalHours)}
                        </div>
                    </div>
                )}
            </div>
            <FocusContext.Provider
                value={focusContextValue}
            >
                <DayView
                    loading={myTimeEntriesResult.fetching}
                    errored={!!myTimeEntriesResult.error}
                    workItems={workItems}
                    onWorkItemClone={handleWorkItemClone}
                    onWorkItemChange={handleWorkItemChange}
                    onWorkItemDelete={handleWorkItemDelete}
                    focusMode={storedConfig.focusMode}
                />
            </FocusContext.Provider>
            <ShortcutsDialog
                dialogOpenTriggerRef={shortcutsDialogOpenTriggerRef}
            />
            {/*
            <UpdateNoteDialog
                dialogOpenTriggerRef={noteDialogOpenTriggerRef}
                note={currentNote}
                onNoteContentUpdate={handleNoteUpdate}
                editingMode={configEditingMode}
                onEditingModeChange={setEditingModeChange}
            />
            */}
            <AddWorkItemDialog
                dialogOpenTriggerRef={dialogOpenTriggerRef}
                workItems={workItems}
                onWorkItemCreate={handleWorkItemCreate}
                allowMultipleEntry={storedConfig.allowMultipleEntry}
            />
        </Page>
    );
}

Component.displayName = 'Home';
