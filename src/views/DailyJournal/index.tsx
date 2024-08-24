import {
    useCallback,
    useContext,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    IoAdd,
    IoCalendarOutline,
    IoChevronBackSharp,
    IoChevronForwardSharp,
} from 'react-icons/io5';
import {
    useNavigate,
    useParams,
} from 'react-router-dom';
import {
    _cs,
    compareStringAsNumber,
    encodeDate,
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    gql,
    useMutation,
    useQuery,
} from 'urql';

import Button from '#components/Button';
import Link, { resolvePath } from '#components/Link';
import Page from '#components/Page';
import Portal from '#components/Portal';
import RawInput from '#components/RawInput';
import FocusContext from '#contexts/focus';
import NavbarContext from '#contexts/navbar';
import RouteContext from '#contexts/route';
import SizeContext from '#contexts/size';
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
import EndSidebar from './EndSidebar';
import ShortcutsDialog from './ShortcutsDialog';
import StartSidebar from './StartSidebar';

import styles from './styles.module.css';

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
    const routes = useContext(RouteContext);
    const navigate = useNavigate();

    const {
        focus,
        register,
        unregister,
    } = useFocusManager();

    const { date: dateFromParams } = useParams<{ date: string | undefined}>();

    const selectedDate = useMemo(() => {
        const today = new Date();

        if (isNotDefined(dateFromParams)) {
            return encodeDate(today);
        }

        const date = new Date(dateFromParams);

        if (Number.isNaN(date.getTime())) {
            return encodeDate(today);
        }

        return encodeDate(date);
    }, [dateFromParams]);

    const setSelectedDate = useCallback((newDateStr: string | undefined) => {
        const today = encodeDate(new Date());
        const newDate = newDateStr === today ? undefined : newDateStr;

        const { resolvedPath } = resolvePath('dailyJournal', routes, { date: newDate });
        if (isNotDefined(resolvedPath)) {
            return;
        }

        navigate(resolvedPath);
    }, [routes, navigate]);

    const getNextDay = useCallback(() => {
        const today = encodeDate(new Date());
        const nextDay = addDays(selectedDate, 1);

        if (today === nextDay) {
            return undefined;
        }

        return nextDay;
    }, [selectedDate]);

    const getPrevDay = useCallback(() => {
        const today = encodeDate(new Date());
        const prevDay = addDays(selectedDate, -1);

        if (today === prevDay) {
            return undefined;
        }

        return prevDay;
    }, [selectedDate]);

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

    const [storedConfig] = useLocalStorage<ConfigStorage>(
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
                    ...updatedItems.map((item) => ({
                        // NOTE: We need to send null to the server so that we
                        // can clear the values
                        clientId: item.clientId ?? null,
                        date: item.date ?? null,
                        description: item.description ?? null,
                        duration: item.duration ?? null,
                        id: item.id ?? null,
                        status: item.status ?? null,
                        task: item.task ?? null,
                        type: item.type ?? null,
                    })),
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
                    clientId: newId,
                };
                delete targetItem.id;
                delete targetItem.description;
                delete targetItem.duration;

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
            if (event.ctrlKey && (event.key === ' ' || event.code === 'Space')) {
                event.preventDefault();
                event.stopPropagation();
                handleAddEntryClick();
            } else if (event.ctrlKey && event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                // FIXME: this binding is empty
            } else if (event.ctrlKey && event.shiftKey && event.key === 'ArrowLeft') {
                event.preventDefault();
                event.stopPropagation();
                setSelectedDate(addDays(selectedDate, -1));
            } else if (event.ctrlKey && event.shiftKey && event.key === 'ArrowRight') {
                event.preventDefault();
                event.stopPropagation();
                setSelectedDate(addDays(selectedDate, 1));
            } else if (event.ctrlKey && event.shiftKey && event.key === 'ArrowDown') {
                event.preventDefault();
                event.stopPropagation();
                setSelectedDate(encodeDate(new Date()));
            } else if (event.ctrlKey && event.shiftKey && event.key === '?') {
                event.preventDefault();
                event.stopPropagation();
                handleShortcutsButtonClick();
            }
        },
        [
            selectedDate,
            setSelectedDate,
            handleAddEntryClick,
            handleShortcutsButtonClick,
        ],
    );

    useKeybind(handleKeybindingsPress);

    const focusContextValue = useMemo(
        () => ({
            register,
            unregister,
        }),
        [register, unregister],
    );

    const handleDateSelection = useCallback(
        (newDate: string | undefined) => {
            setSelectedDate(newDate);
        },
        [setSelectedDate],
    );

    const { midActionsRef } = useContext(NavbarContext);
    const { width: windowWidth } = useContext(SizeContext);

    const handleSwipeLeft = useCallback(
        () => {
            handleDateSelection(addDays(selectedDate, 1));
        },
        [selectedDate, handleDateSelection],
    );

    const handleSwipeRight = useCallback(
        () => {
            handleDateSelection(addDays(selectedDate, -1));
        },
        [selectedDate, handleDateSelection],
    );

    return (
        <Page
            documentTitle="Timur - Daily Journal"
            className={styles.dailyJournal}
            contentClassName={styles.content}
            startAsideContainerClassName={styles.startAside}
            startAsideContent={(
                <StartSidebar
                    workItems={workItems}
                />
            )}
            endAsideContent={(
                <EndSidebar
                    workItems={workItems}
                    onWorkItemCreate={handleWorkItemCreate}
                />
            )}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
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
            <Portal container={midActionsRef}>
                <div className={styles.dateNavigation}>
                    {windowWidth >= 900 && (
                        <>
                            <Link
                                to="dailyJournal"
                                urlParams={{ date: getPrevDay() }}
                                variant="secondary"
                                title="Previous day"
                            >
                                <IoChevronBackSharp />
                            </Link>
                            <Link
                                to="dailyJournal"
                                urlParams={{ date: getNextDay() }}
                                variant="secondary"
                                title="Next day"
                            >
                                <IoChevronForwardSharp />
                            </Link>
                        </>
                    )}
                    <div className={styles.dateContainer}>
                        <RawInput
                            elementRef={dateInputRef}
                            type="date"
                            className={styles.dateInput}
                            name={undefined}
                            value={selectedDate}
                            onChange={setSelectedDate}
                        />
                        <Button
                            title="Open calendar"
                            name={undefined}
                            variant="secondary"
                            onClick={handleDateButtonClick}
                        >
                            <IoCalendarOutline />
                        </Button>
                    </div>
                </div>
            </Portal>
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
                    selectedDate={selectedDate}
                />
            </FocusContext.Provider>
            <Button
                name={undefined}
                onClick={handleAddEntryClick}
                icons={<IoAdd />}
                title="Add entry"
            >
                Add entry
            </Button>
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
            />
        </Page>
    );
}

Component.displayName = 'DailyJournal';
