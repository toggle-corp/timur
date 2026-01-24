import {
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    RiAddLine,
    RiArrowGoBackFill,
    RiArrowGoForwardFill,
    RiArrowLeftSLine,
    RiArrowRightSLine,
    RiCalendar2Line,
    RiHomeOfficeLine,
    RiSettingsLine,
    RiStickyNoteAddLine,
    RiTerminalBoxLine,
} from 'react-icons/ri';
import {
    useNavigate,
    useParams,
} from 'react-router-dom';
import {
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
    TimeEntryTypeEnum,
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

import AddWorkItemDialog from './AddWorkItemDialog';
import AvailabilityDialog from './AvailabilityDialog';
import DayView from './DayView';
import EndSidebar from './EndSidebar';
import ShortcutsDialog from './ShortcutsDialog';
import StartSidebar from './StartSidebar';
import UpdateNoteDialog from './UpdateNoteDialog';

import styles from './styles.module.css';

function inferTypeFromDescription(desc: string): TimeEntryTypeEnum | undefined {
    const sanitizedDesc = desc.toLowerCase();
    if (sanitizedDesc.includes('meeting') || sanitizedDesc.includes('standup') || sanitizedDesc.includes('all hands') || sanitizedDesc.includes('catchup')) {
        return 'INTERNAL_MEETING';
    }
    if (sanitizedDesc.includes('discuss')) {
        return 'INTERNAL_DISCUSSION';
    }
    if (sanitizedDesc.includes('deploy')) {
        return 'DEV_OPS';
    }
    if (sanitizedDesc.includes('research') || sanitizedDesc.includes('study')) {
        return 'RESEARCH';
    }
    if (sanitizedDesc.includes('documentation')) {
        return 'DOCUMENTATION';
    }
    if (sanitizedDesc.includes('review pr') || sanitizedDesc.includes('refactor') || sanitizedDesc.includes('fix') || sanitizedDesc.includes('debug')) {
        return 'DEVELOPMENT';
    }
    return undefined;
}

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

    const {
        zeitgeist,
        commands,
        setZeitgeist,
        setCommands,
        watch,
        undoable,
        redoable,
    } = useContext(CommandContext);

    const {
        entries: workItems,
        setEntries: setWorkItems,
        update: setWorkItemChange,
        redo,
        undo,
    } = useCommand({
        defaultEntries: [],
        commands,
        filter,
        keySelector,
        watch,
        zeitgeist,
        setZeitgeist,
        setCommands,
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
        },
        [
            myTimeEntriesResult.fetching,
            myTimeEntriesResult.data,
            myTimeEntriesResult.error,
            setWorkItems,
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
                ...override,
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

    const handleWorkItemAssist = useCallback(
        (workItemClientId: string) => {
            const sourceItem = workItems.find((item) => item.clientId === workItemClientId);
            if (!sourceItem) {
                // eslint-disable-next-line no-console
                console.error(`Could not find item ${workItemClientId} while splitting`);
                return;
            }

            // NOTE: split on 2 new liness
            const descriptions = (sourceItem.description ?? '')
                .split(/\n\n+/)
                .map((line) => line.trim()).filter((item) => item !== '');

            if (descriptions.length <= 0) {
                return;
            }

            const [firstDescription, ...otherDescriptions] = descriptions;

            const now = new Date().getTime();

            otherDescriptions.forEach((desc) => {
                const type = inferTypeFromDescription(desc);
                const targetItem = {
                    ...sourceItem,
                    description: desc,
                    type,
                    clientId: getNewId(),
                };
                delete targetItem.id;
                delete targetItem.duration;

                setWorkItemChange({
                    type: 'add',
                    key: targetItem.clientId,
                    newValue: targetItem,
                    timestamp: now,
                });
            });

            setWorkItemChange({
                type: 'edit',
                key: sourceItem.clientId,
                oldValue: {
                    description: sourceItem.description,
                    type: sourceItem.type,
                },
                newValue: {
                    description: firstDescription,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    type: inferTypeFromDescription(firstDescription!) ?? sourceItem.type,
                },
                timestamp: now,
            });
        },
        [workItems, setWorkItemChange],
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
                    {selectedDate !== fullDate && (
                        <Link
                            to="dailyJournal"
                            variant="quaternary"
                            icons={(
                                <RiCalendar2Line />
                            )}
                        >
                            Today
                        </Link>
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
                            icons={(
                                <RiStickyNoteAddLine />
                            )}
                        >
                            Note
                        </Button>
                    )}
                    {screen === 'desktop' && (
                        <Button
                            title="Show shortcuts"
                            name={undefined}
                            variant="quaternary"
                            onClick={handleShortcutsButtonClick}
                            icons={(
                                <RiTerminalBoxLine />
                            )}
                        >
                            Shortcuts
                        </Button>
                    )}
                    {screen === 'desktop' && (
                        <Link
                            to="settings"
                            title="Settings"
                            variant="quaternary"
                            icons={(
                                <RiSettingsLine />
                            )}
                        >
                            Settings
                        </Link>
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
                    onWorkItemAssist={handleWorkItemAssist}
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
                <Button
                    name={undefined}
                    title="Undo"
                    onClick={undo}
                    variant="quaternary"
                    disabled={!undoable}
                >
                    <RiArrowGoBackFill />
                </Button>
                <Button
                    name={undefined}
                    title="Redo"
                    onClick={redo}
                    variant="quaternary"
                    disabled={!redoable}
                >
                    <RiArrowGoForwardFill />
                </Button>
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
