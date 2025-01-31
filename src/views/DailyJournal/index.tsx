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
    RiAddLine,
    RiArrowLeftSLine,
    RiArrowRightSLine,
    RiCalendar2Line,
    RiHomeOfficeLine,
    RiStickyNoteAddLine,
    RiTerminalBoxLine,
} from 'react-icons/ri';
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
    unique,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import AvailabilityIndicator from '#components/AvailabilityIndicator';
import Button from '#components/Button';
import CalendarInput from '#components/CalendarInput';
import Link, { resolvePath } from '#components/Link';
import Page from '#components/Page';
import Portal from '#components/Portal';
import CommandContext from '#contexts/command';
import DateContext from '#contexts/date';
import FocusContext from '#contexts/focus';
import NavbarContext from '#contexts/navbar';
import RouteContext from '#contexts/route';
import SizeContext from '#contexts/size';
import {
    MyTimeEntriesQuery,
    MyTimeEntriesQueryVariables,
} from '#generated/types/graphql';
import useCommand from '#hooks/useCommand';
import { useFocusManager } from '#hooks/useFocus';
import useKeybind from '#hooks/useKeybind';
import useLocalStorage from '#hooks/useLocalStorage';
import { pick } from '#utils/command';
import {
    addDays,
    getNewId,
} from '#utils/common';
import { defaultConfigValue } from '#utils/constants';
import { removeNull } from '#utils/nullHelper';
import {
    EntriesAsList,
    Task,
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
                # We can use this infromation to get task that are already archived
                task {
                    id
                    name
                    contract {
                        id
                        name
                        project {
                            id
                            name
                            logo {
                                url
                            }
                            projectClient {
                                id
                                name
                            }
                        }
                    }
                }
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

/*
query MyQuery {
  private {
    allTimeEntries(filters: {statuses: TODO, users: "9"}) {
      clientId
      id
      description
      date
      startTime
      duration
      status
      taskId
      type
    }
  }
}
*/

/*
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
*/

// TODO: Do not use JSON.stringify for comparison
// TODO: use filtered localState instead of workItems
/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const { date: dateFromParams } = useParams<{ date: string | undefined}>();
    const { fullDate } = useContext(DateContext);
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

    const navigate = useNavigate();
    const routes = useContext(RouteContext);
    const { midActionsRef } = useContext(NavbarContext);
    const { screen } = useContext(SizeContext);

    // State
    const filter = useCallback(
        (entry: WorkItem) => entry.date === selectedDate,
        [selectedDate],
    );
    const keySelector = useCallback(
        (entry: WorkItem) => entry.clientId,
        [],
    );

    const { zeitgeist, commands, watch } = useContext(CommandContext);

    const {
        entries: workItems,
        setEntries: setWorkItems,
        update: setWorkItemChange,
        redo,
        undo,
    } = useCommand({
        defaultEntries: [],
        filter,
        commands,
        keySelector,
        watch,
        zeitgeist,
    });

    const [tasks, setTasks] = useState<Task[]>([]);
    const [storedConfig] = useLocalStorage('timur-config');

    // UI
    const {
        focus,
        register,
        unregister,
    } = useFocusManager();

    // NOTE: We are opening the dialog from this parent component
    interface CalendarElement {
        resetView:(year: number, month: number) => void;
    }
    const dialogOpenTriggerRef = useRef<(() => void) | undefined>();
    const noteDialogOpenTriggerRef = useRef<(() => void) | undefined>();
    const shortcutsDialogOpenTriggerRef = useRef<(() => void) | undefined>();
    const availabilityDialogOpenTriggerRef = useRef<(() => void) | undefined>();
    const calendarRef = useRef<CalendarElement>(null);

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

    /*
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
    */

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

            const tasksFromServer = unique(
                myTimeEntriesResult.data?.private.myTimeEntries?.flatMap(
                    (timeEntry) => timeEntry.task,
                ) ?? [],
                (item) => item.id,
            );

            setTasks(tasksFromServer);
            setWorkItems(workItemsFromServer);
            // addOrUpdateServerData(workItemsFromServer);
            // addOrUpdateStateData(workItemsFromServer);
        },
        [
            myTimeEntriesResult.fetching,
            myTimeEntriesResult.data,
            myTimeEntriesResult.error,
            setWorkItems,
            // addOrUpdateServerData,
            // addOrUpdateStateData,
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

            setWorkItemChange({
                type: 'add',
                key: newItem.clientId,
                newValue: newItem,
                timestamp: new Date().getTime(),
            });

            focus(String(newId));
        },
        [
            storedConfig.defaultTaskType,
            storedConfig.defaultTaskStatus,
            selectedDate,
            setWorkItemChange,
            focus,
        ],
    );

    const handleWorkItemClone = useCallback(
        (workItemClientId: string, override?: Partial<WorkItem>) => {
            const oldItem = workItems.find((item) => item.clientId === workItemClientId);
            if (!oldItem) {
                // eslint-disable-next-line no-console
                console.error(`Could not find item ${workItemClientId} while cloning`);
                return;
            }
            const newId = getNewId();
            const newItem: WorkItem = {
                ...oldItem,
                clientId: newId,
            };
            delete newItem.id;
            // NOTE: If we have defined overrides, we don't need to clear
            // description and duration
            if (!override) {
                delete newItem.description;
                delete newItem.duration;
            }

            setWorkItemChange({
                type: 'add',
                key: newItem.clientId,
                newValue: newItem,
                timestamp: new Date().getTime(),
            });

            focus(String(newId));
        },
        [workItems, setWorkItemChange, focus],
    );

    const handleWorkItemDelete = useCallback(
        (workItemClientId: string) => {
            const oldItem = workItems.find((item) => item.clientId === workItemClientId);
            if (!oldItem) {
                // eslint-disable-next-line no-console
                console.error(`Could not find item ${workItemClientId} while deleting`);
                return;
            }
            setWorkItemChange({
                type: 'delete',
                key: workItemClientId,
                oldValue: oldItem,
                timestamp: new Date().getTime(),
            });
        },
        [setWorkItemChange, workItems],
    );

    const handleWorkItemChange = useCallback(
        (workItemClientId: string, ...entries: EntriesAsList<WorkItem>) => {
            const oldItem = workItems.find((item) => item.clientId === workItemClientId);
            if (!oldItem) {
                // eslint-disable-next-line no-console
                console.error(`Could not find item ${workItemClientId} while editing`);
                return;
            }
            const changes: Partial<WorkItem> = {
                [entries[1]]: entries[0],
            };

            const tentativeNewItem = {
                ...oldItem,
                ...changes,
            };

            if (
                isDefined(tentativeNewItem.duration)
                && tentativeNewItem.duration > 0
                && oldItem.duration !== tentativeNewItem.duration
                && tentativeNewItem.status === 'TODO'
            ) {
                tentativeNewItem.status = 'DOING';
            }
            setWorkItemChange({
                type: 'edit',
                key: workItemClientId,
                oldValue: pick(oldItem, Object.keys(changes) as (keyof WorkItem)[]),
                newValue: changes,
                timestamp: new Date().getTime(),
            });
        },
        [setWorkItemChange, workItems],
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

    const setSelectedDate = useCallback((newDateStr: string | undefined) => {
        const newDate = newDateStr === fullDate ? undefined : newDateStr;

        const { resolvedPath } = resolvePath('dailyJournal', routes, { date: newDate });
        if (isNotDefined(resolvedPath)) {
            return;
        }

        navigate(resolvedPath);
    }, [routes, navigate, fullDate]);

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

    const handleDateSelection = useCallback(
        (newDate: string | undefined) => {
            setSelectedDate(newDate);
        },
        [setSelectedDate],
    );

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

    const focusContextValue = useMemo(
        () => ({
            register,
            unregister,
        }),
        [register, unregister],
    );

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

    const editMode = storedConfig.editingMode ?? defaultConfigValue.editingMode;

    // FIXME: memoize this
    const filteredWorkItems = workItems.filter((item) => item.date === selectedDate);

    const entriesWithError = filteredWorkItems
        .filter((item) => (
            item.status !== 'TODO' && (
                isNotDefined(item.type)
                || isNotDefined(item.duration)
            )
        )).length;

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
                    // (isObsolete || bulkMutationState.fetching) && styles.active,
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
                    {screen === 'desktop' && (
                        <>
                            <Link
                                to="dailyJournal"
                                urlParams={{ date: getPrevDay() }}
                                variant="quaternary"
                                title="Previous day"
                            >
                                <RiArrowLeftSLine />
                            </Link>
                            <Link
                                to="dailyJournal"
                                urlParams={{ date: getNextDay() }}
                                variant="quaternary"
                                title="Next day"
                            >
                                <RiArrowRightSLine />
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
                        <RiCalendar2Line />
                    </CalendarInput>
                    <Button
                        name={undefined}
                        title="Undo"
                        onClick={undo}
                        variant="quaternary"
                    >
                        Undo
                    </Button>
                    <Button
                        name={undefined}
                        title="Redo"
                        onClick={redo}
                        variant="quaternary"
                    >
                        Redo
                    </Button>
                    {entriesWithError > 0 && (
                        <div className={styles.warningBadge}>
                            <FcHighPriority />
                            <span>
                                {`${entriesWithError} issues`}
                            </span>
                        </div>
                    )}
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
                            fallback={<RiHomeOfficeLine />}
                        />
                    </Button>
                    {screen === 'desktop' && (
                        <Button
                            name={undefined}
                            onClick={handleNoteUpdateClick}
                            title="Update Note"
                            variant="quaternary"
                        >
                            <RiStickyNoteAddLine />
                        </Button>
                    )}
                    {screen === 'desktop' && (
                        <Button
                            title="Show shortcuts"
                            name={undefined}
                            variant="quaternary"
                            onClick={handleShortcutsButtonClick}
                        >
                            <RiTerminalBoxLine />
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
                    tasks={tasks}
                    onWorkItemClone={handleWorkItemClone}
                    onWorkItemChange={handleWorkItemChange}
                    onWorkItemDelete={handleWorkItemDelete}
                    selectedDate={selectedDate}
                />
            </FocusContext.Provider>
            <div className={styles.bottomActions}>
                <Button
                    name={undefined}
                    onClick={handleAddEntryClick}
                    icons={<RiAddLine />}
                    title="Add entry"
                >
                    Add entry
                </Button>
                {selectedDate !== fullDate && (
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
