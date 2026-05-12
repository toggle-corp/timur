import {
    useCallback,
    useContext,
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
    RiCalendarCheckLine,
    RiStickyNoteAddLine,
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

import Button from '#components/Button';
import Link, { resolvePath } from '#components/Link';
import Page from '#components/Page';
import Portal from '#components/Portal';
import CommandContext from '#contexts/command';
import DateContext from '#contexts/date';
import FocusContext from '#contexts/focus';
import NavbarContext from '#contexts/navbar';
import RouteContext from '#contexts/route';
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
import MyAvailabilityIndicator from './MyAvailabilityIndicator';
import ShortcutsDialog from './ShortcutsDialog';
import StartSidebar from './StartSidebar';
import UpdateNoteDialog from './UpdateNoteDialog';

import styles from './styles.module.css';

function inferTypeFromDescription(desc: string): TimeEntryTypeEnum | undefined {
    const lower = desc.toLowerCase();
    const matches = (pattern: RegExp) => pattern.test(lower);

    if (matches(/\b(client meeting|client call|external meeting)\b/)) {
        return 'EXTERNAL_MEETING';
    }

    if (
        matches(/\b(meeting|standup|stand-up|all hands|all-hands)\b/)
        || matches(/\b1:1\b/)
    ) {
        return 'INTERNAL_MEETING';
    }
    if (matches(/\b(client discussion|external discussion)\b/)) {
        return 'EXTERNAL_DISCUSSION';
    }
    if (matches(/\b(discuss|discussion|brainstorm)\b/)) {
        return 'INTERNAL_DISCUSSION';
    }
    if (matches(/\b(review|pull request|merge request)\b/)) {
        return 'REVIEW';
    }
    if (matches(/\b(deploy|deployment|pipeline|ci|cd|infra|release)\b/)) {
        return 'DEV_OPS';
    }
    if (matches(/\b(test|tests|testing|qa|qc|regression)\b/)) {
        return 'TESTING';
    }
    if (matches(/\b(design|wireframe|mockup|ux|ui)\b/)) {
        return 'DESIGN';
    }
    if (matches(/\b(research|study|investigate|spike|explore)\b/)) {
        return 'RESEARCH';
    }
    if (matches(/\b(documentation|docs|readme|wiki|document)\b/)) {
        return 'DOCUMENTATION';
    }
    if (matches(/\b(planning|project board|plan|roadmap|backlog|estimate|estimation)\b/)) {
        return 'PROJECT_MANAGEMENT';
    }
    if (matches(/\b(annotation|annotate|labelling|labeling|label)\b/)) {
        return 'ANNOTATION';
    }
    if (matches(/\b(refactor|fix|fixing|fixed|fixes|bugfix|hotfix|debug|implement|implementation|feature)\b/)) {
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
                            shortName
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
        }
    }
`;

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

    // State
    const initialWorkItemFilter = useCallback(
        (entry: WorkItem) => entry.date === selectedDate,
        [selectedDate],
    );
    const workItemKeySelector = useCallback(
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

    // NOTE: logical time
    const [lastEditedAt, setLastEditedAt] = useState<number>(1);

    const interceptedWatch: typeof watch = useCallback(
        (...args) => {
            watch(...args);
            setLastEditedAt((val) => val + 1);
        },
        [watch],
    );

    const {
        entries: workItems,
        setEntries: setWorkItems,
        update: setWorkItemChange,
        redo,
        undo,
    } = useCommand({
        defaultEntries: [],
        commands,
        initialFilter: initialWorkItemFilter,
        keySelector: workItemKeySelector,
        watch: interceptedWatch,
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

    const dialogOpenTriggerRef = useRef<((description: string | undefined) => void) | undefined>(
        undefined);
    const noteDialogOpenTriggerRef = useRef<(() => void) | undefined>(undefined);
    const shortcutsDialogOpenTriggerRef = useRef<(() => void) | undefined>(undefined);
    const availabilityDialogOpenTriggerRef = useRef<(() => void) | undefined>(undefined);
    const pendingCalendarOverrideRef = useRef<Partial<WorkItem> | undefined>(undefined);

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
                setWorkItems(
                    [],
                    (entry) => entry.date === selectedDate,
                );
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
            setWorkItems(
                workItemsFromServer,
                (entry) => entry.date === selectedDate,
            );
        },
        [
            myTimeEntriesResult.fetching,
            myTimeEntriesResult.data,
            myTimeEntriesResult.error,
            setWorkItems,
            selectedDate,
        ],
    );

    const handleWorkItemCreate = useCallback(
        (taskId: string) => {
            const override = pendingCalendarOverrideRef.current;
            pendingCalendarOverrideRef.current = undefined;

            const newId = getNewId();
            const newItem: WorkItem = {
                clientId: newId,
                task: taskId,
                type: storedConfig.defaultTaskType,
                status: storedConfig.defaultTaskStatus,
                date: selectedDate,
                ...override,
            };

            setWorkItemChange(
                {
                    type: 'add',
                    key: newItem.clientId,
                    newValue: newItem,
                    timestamp: new Date().getTime(),
                },
                (entry) => entry.date === selectedDate,
            );

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

    const handleWorkItemCreateFromCalendar = useCallback(
        (override: Partial<WorkItem>) => {
            pendingCalendarOverrideRef.current = {
                ...override,
                type: override.description
                    ? inferTypeFromDescription(override.description)
                    : undefined,
            };
            if (dialogOpenTriggerRef.current) {
                dialogOpenTriggerRef.current(override.description ?? undefined);
            }
        },
        [],
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

            setWorkItemChange(
                {
                    type: 'add',
                    key: newItem.clientId,
                    newValue: newItem,
                    timestamp: new Date().getTime(),
                },
                (entry) => entry.date === selectedDate,
            );

            focus(String(newId));
        },
        [workItems, setWorkItemChange, selectedDate, focus],
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

                setWorkItemChange(
                    {
                        type: 'add',
                        key: targetItem.clientId,
                        newValue: targetItem,
                        timestamp: now,
                    },
                    (entry) => entry.date === selectedDate,
                );
            });

            setWorkItemChange(
                {
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
                },
                (entry) => entry.date === selectedDate,
            );
        },
        [workItems, setWorkItemChange, selectedDate],
    );

    const handleWorkItemDelete = useCallback(
        (workItemClientId: string) => {
            const oldItem = workItems.find((item) => item.clientId === workItemClientId);
            if (!oldItem) {
                // eslint-disable-next-line no-console
                console.error(`Could not find item ${workItemClientId} while deleting`);
                return;
            }
            setWorkItemChange(
                {
                    type: 'delete',
                    key: workItemClientId,
                    oldValue: oldItem,
                    timestamp: new Date().getTime(),
                },
                (entry) => entry.date === selectedDate,
            );
        },
        [setWorkItemChange, workItems, selectedDate],
    );

    const handleWorkItemUndo = useCallback(
        () => {
            undo((entry) => entry.date === selectedDate);
        },
        [undo, selectedDate],
    );

    const handleWorkItemRedo = useCallback(
        () => {
            redo((entry) => entry.date === selectedDate);
        },
        [redo, selectedDate],
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
                changes.status = 'DOING';
            }

            setWorkItemChange(
                {
                    type: 'edit',
                    key: workItemClientId,
                    oldValue: pick(oldItem, Object.keys(changes) as (keyof WorkItem)[]),
                    newValue: changes,
                    timestamp: new Date().getTime(),
                },
                (entry) => entry.date === selectedDate,
            );
        },
        [setWorkItemChange, workItems, selectedDate],
    );

    const handleNoteUpdateClick = useCallback(
        () => {
            if (noteDialogOpenTriggerRef.current) {
                noteDialogOpenTriggerRef.current();
            }
        },
        [],
    );

    const handleAddWorkItemCreate = useCallback(
        () => {
            if (dialogOpenTriggerRef.current) {
                dialogOpenTriggerRef.current(undefined);
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
                handleAddWorkItemCreate();
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
            handleAddWorkItemCreate,
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

    return (
        <Page
            documentTitle="Timur - Daily Journal"
            className={styles.dailyJournal}
            contentClassName={styles.content}
            startAsideContent={(
                <StartSidebar
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    onShortcutsClick={handleShortcutsButtonClick}
                    onWorkItemCreateFromCalendar={handleWorkItemCreateFromCalendar}
                    dayWorkItems={workItems}
                    lastEditedAt={lastEditedAt}
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
            <Portal container={midActionsRef}>
                <div className={styles.dateNavigation}>
                    <Link
                        to="dailyJournal"
                        urlParams={{ date: getPrevDay() }}
                        className={styles.desktopOnly}
                        variant="tertiary"
                        title="Previous day"
                    >
                        <RiArrowLeftSLine />
                    </Link>
                    <Link
                        to="dailyJournal"
                        urlParams={{ date: getNextDay() }}
                        className={styles.desktopOnly}
                        variant="tertiary"
                        title="Next day"
                    >
                        <RiArrowRightSLine />
                    </Link>
                    {selectedDate !== fullDate && (
                        <Link
                            to="dailyJournal"
                            variant="tertiary"
                            title="Jump to today"
                        >
                            <RiCalendarCheckLine />
                        </Link>
                    )}
                    {(undoable || redoable) && (
                        <div
                            className={_cs(styles.separator, styles.desktopOnly)}
                            role="separator"
                        />
                    )}
                    {undoable && (
                        <Button
                            name={undefined}
                            title="Undo"
                            onClick={handleWorkItemUndo}
                            variant="tertiary"
                        >
                            <RiArrowGoBackFill />
                        </Button>
                    )}
                    {redoable && (
                        <Button
                            name={undefined}
                            title="Redo"
                            onClick={handleWorkItemRedo}
                            variant="tertiary"
                        >
                            <RiArrowGoForwardFill />
                        </Button>
                    )}
                    <div className={styles.spacer} />
                    <Button
                        name={undefined}
                        className={styles.desktopOnly}
                        onClick={handleNoteUpdateClick}
                        title="Update Note"
                        variant="tertiary"
                        icons={(
                            <RiStickyNoteAddLine />
                        )}
                    >
                        Note
                    </Button>
                    <Button
                        name={undefined}
                        onClick={handleAvailabilityButtonClick}
                        title="Update availability"
                        variant="tertiary"
                    >
                        <MyAvailabilityIndicator date={selectedDate} />
                    </Button>
                </div>
            </Portal>
            <FocusContext.Provider
                value={focusContextValue}
            >
                <DayView
                    loading={myTimeEntriesResult.fetching}
                    // FIXME: Add a Suspense block
                    // errored={false}
                    workItems={workItems}
                    tasks={tasks}
                    onWorkItemClone={handleWorkItemClone}
                    onWorkItemAssist={handleWorkItemAssist}
                    onWorkItemChange={handleWorkItemChange}
                    onWorkItemDelete={handleWorkItemDelete}
                    selectedDate={selectedDate}
                />
            </FocusContext.Provider>
            <Button
                name={undefined}
                className={_cs(
                    styles.fab,
                    storedConfig.startSidebarShown && styles.startSidebarShown,
                )}
                onClick={handleAddWorkItemCreate}
                icons={<RiAddLine />}
                title="Add entry"
                variant="primary"
            >
                Add entry
            </Button>
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
                onWorkItemCreate={handleWorkItemCreate}
            />
        </Page>
    );
}

Component.displayName = 'DailyJournal';
