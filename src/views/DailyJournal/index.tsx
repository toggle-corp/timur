import {
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { FcHighPriority } from 'react-icons/fc';
import {
    IoAdd,
    IoCalendarOutline,
    IoChevronBackSharp,
    IoChevronForwardSharp,
    IoNewspaperOutline,
    IoStorefrontOutline,
    IoTerminalOutline,
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
    isTruthyString,
} from '@togglecorp/fujs';
import {
    gql,
    useMutation,
    useQuery,
} from 'urql';

import AvailabilityIndicator from '#components/AvailabilityIndicator';
import Button from '#components/Button';
import CalendarInput from '#components/CalendarInput';
import Link, { resolvePath } from '#components/Link';
import Page from '#components/Page';
import Portal from '#components/Portal';
import DateContext from '#contexts/date';
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
import { defaultConfigValue } from '#utils/constants';
import { removeNull } from '#utils/nullHelper';
import {
    EntriesAsList,
    WorkItem,
} from '#utils/types';

import timurLogo from '../../App/icon.svg';
import AddWorkItemDialog from './AddWorkItemDialog';
import AvailabilityDialog from './AvailabilityDialog';
import DayView from './DayView';
import EndSidebar from './EndSidebar';
import ShortcutsDialog from './ShortcutsDialog';
import StartSidebar from './StartSidebar';
import UpdateNoteDialog from './UpdateNoteDialog';

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
            journal(date: $date) {
                id
                date
                leaveType
                wfhType
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
/** @knipignore */
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
    const { fullDate } = useContext(DateContext);

    // NOTE: We are opening the dialog from this parent component
    const dialogOpenTriggerRef = useRef<(() => void) | undefined>();
    const noteDialogOpenTriggerRef = useRef<(() => void) | undefined>();
    const shortcutsDialogOpenTriggerRef = useRef<(() => void) | undefined>();
    const availabilityDialogOpenTriggerRef = useRef<(() => void) | undefined>();
    const calendarRef = useRef<
        { resetView:(year: number, month: number) => void; }
            >(null);

    const selectedDate = useMemo(() => {
        if (isNotDefined(dateFromParams)) {
            return fullDate;
        }

        const date = new Date(dateFromParams);

        if (Number.isNaN(date.getTime())) {
            return fullDate;
        }

        return encodeDate(date);
    }, [dateFromParams, fullDate]);

    useEffect(
        () => {
            if (calendarRef.current && selectedDate) {
                const selectedDateObj = new Date(selectedDate);
                calendarRef.current.resetView(
                    selectedDateObj.getFullYear(),
                    selectedDateObj.getMonth(),
                );
            }
        },
        [selectedDate],
    );

    const setSelectedDate = useCallback((newDateStr: string | undefined) => {
        const newDate = newDateStr === fullDate ? undefined : newDateStr;

        const { resolvedPath } = resolvePath('dailyJournal', routes, { date: newDate });
        if (isNotDefined(resolvedPath)) {
            return;
        }

        navigate(resolvedPath);
    }, [routes, navigate, fullDate]);

    const getNextDay = useCallback(() => {
        const nextDay = addDays(selectedDate, 1);

        if (fullDate === nextDay) {
            return undefined;
        }

        return nextDay;
    }, [selectedDate, fullDate]);

    const getPrevDay = useCallback(() => {
        const prevDay = addDays(selectedDate, -1);

        if (fullDate === prevDay) {
            return undefined;
        }

        return prevDay;
    }, [selectedDate, fullDate]);

    const [storedConfig] = useLocalStorage('timur-config');

    const editMode = storedConfig.editingMode ?? defaultConfigValue.editingMode;

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
        (workItemClientId: string, override?: Partial<WorkItem>) => {
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
                    ...override,
                    clientId: newId,
                };
                delete targetItem.id;
                // NOTE: If we have defined overrides, we don't need to clear
                // description and duration
                if (!override) {
                    delete targetItem.description;
                    delete targetItem.duration;
                }

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

    const handleNoteUpdateClick = useCallback(
        () => {
            if (noteDialogOpenTriggerRef.current) {
                noteDialogOpenTriggerRef.current();
            }
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

    const handleAvailabilityButtonClick = useCallback(
        () => {
            if (availabilityDialogOpenTriggerRef.current) {
                availabilityDialogOpenTriggerRef.current();
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
                handleNoteUpdateClick();
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
                setSelectedDate(fullDate);
            } else if (event.ctrlKey && event.shiftKey && event.key === '?') {
                event.preventDefault();
                event.stopPropagation();
                handleShortcutsButtonClick();
            }
        },
        [
            fullDate,
            selectedDate,
            setSelectedDate,
            handleAddEntryClick,
            handleShortcutsButtonClick,
            handleNoteUpdateClick,
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

    // FIXME: memoize this
    const filteredWorkItems = workItems.filter((item) => item.date === selectedDate);

    const entriesWithoutTask = filteredWorkItems
        .filter((item) => isNotDefined(item.type) && item.status !== 'TODO')
        .length;
    const entriesWithoutHours = filteredWorkItems
        .filter((item) => isNotDefined(item.duration) && item.status !== 'TODO')
        .length;

    const leaveType = myTimeEntriesResult.data?.private.journal?.leaveType;
    const wfhType = myTimeEntriesResult.data?.private.journal?.wfhType;

    return (
        <Page
            documentTitle="Timur - Daily Journal"
            className={styles.dailyJournal}
            contentClassName={styles.content}
            startAsideContainerClassName={styles.startAside}
            startAsideContent={(
                <StartSidebar
                    calendarComponentRef={calendarRef}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                />
            )}
            endAsideContent={(
                <EndSidebar
                    workItems={filteredWorkItems}
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
                                variant="quaternary"
                                title="Previous day"
                            >
                                <IoChevronBackSharp />
                            </Link>
                            <Link
                                to="dailyJournal"
                                urlParams={{ date: getNextDay() }}
                                variant="quaternary"
                                title="Next day"
                            >
                                <IoChevronForwardSharp />
                            </Link>
                        </>
                    )}
                    <CalendarInput
                        title="Open calendar"
                        name={undefined}
                        variant="quaternary"
                        value={selectedDate}
                        onChange={setSelectedDate}
                    >
                        <IoCalendarOutline />
                    </CalendarInput>
                    <div className={styles.spacer} />
                    <Button
                        name={undefined}
                        onClick={handleAvailabilityButtonClick}
                        title="Update availability"
                        variant="quaternary"
                    >
                        <AvailabilityIndicator
                            wfhType={wfhType}
                            leaveType={leaveType}
                            fallback={<IoStorefrontOutline />}
                        />
                    </Button>
                    {windowWidth >= 900 && (
                        <Button
                            name={undefined}
                            onClick={handleNoteUpdateClick}
                            title="Update Note"
                            variant="quaternary"
                        >
                            <IoNewspaperOutline />
                        </Button>
                    )}
                    {windowWidth >= 900 && (
                        <Button
                            title="Show shortcuts"
                            name={undefined}
                            variant="quaternary"
                            onClick={handleShortcutsButtonClick}
                        >
                            <IoTerminalOutline />
                        </Button>
                    )}
                </div>
            </Portal>
            <FocusContext.Provider
                value={focusContextValue}
            >
                <DayView
                    loading={myTimeEntriesResult.fetching}
                    errored={!!myTimeEntriesResult.error}
                    workItems={filteredWorkItems}
                    onWorkItemClone={handleWorkItemClone}
                    onWorkItemChange={handleWorkItemChange}
                    onWorkItemDelete={handleWorkItemDelete}
                    selectedDate={selectedDate}
                />
            </FocusContext.Provider>
            {entriesWithoutTask + entriesWithoutHours > 0 && (
                <div className={styles.warning}>
                    {entriesWithoutTask > 0 && (
                        <div className={styles.warningBadge}>
                            <FcHighPriority />
                            <span>
                                {`${entriesWithoutTask} uncategorized entries`}
                            </span>
                        </div>
                    )}
                    {entriesWithoutHours > 0 && (
                        <div className={styles.warningBadge}>
                            <FcHighPriority />
                            <span>
                                {`${entriesWithoutHours} untracked entries`}
                            </span>
                        </div>
                    )}
                </div>
            )}
            <div className={styles.bottomActions}>
                <Button
                    name={undefined}
                    onClick={handleAddEntryClick}
                    icons={<IoAdd />}
                    title="Add entry"
                >
                    Add entry
                </Button>
                {!isTruthyString(dateFromParams) && (
                    <Link
                        to="dailyJournal"
                        variant="quaternary"
                    >
                        Go to today
                    </Link>
                )}
            </div>
            <ShortcutsDialog
                dialogOpenTriggerRef={shortcutsDialogOpenTriggerRef}
            />
            <AvailabilityDialog
                dialogOpenTriggerRef={availabilityDialogOpenTriggerRef}
                date={selectedDate}
            />
            <UpdateNoteDialog
                dialogOpenTriggerRef={noteDialogOpenTriggerRef}
                date={selectedDate}
                editingMode={editMode}
            />
            <AddWorkItemDialog
                dialogOpenTriggerRef={dialogOpenTriggerRef}
                workItems={filteredWorkItems}
                onWorkItemCreate={handleWorkItemCreate}
            />
        </Page>
    );
}

Component.displayName = 'DailyJournal';
