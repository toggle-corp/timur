import {
    type Dispatch,
    type SetStateAction,
    useCallback,
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
    mapToList,
    sum,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import Button from '#components/Button';
import Page from '#components/Page';
import RawInput from '#components/RawInput';
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
                id
                startTime
                type
                typeDisplay
                description
                duration
                status
                task {
                    id
                    name
                    contract {
                        id
                        name
                        project {
                            id
                            name
                            client {
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
    const [storedState, setStoredState] = useLocalStorage<{
        appVersion: string,
        workItems: WorkItem[],
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
            workItems: [],
            configDefaultTaskType: 'development',
            configDefaultTaskStatus: 'done',
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
    const workItems = storedState.workItems ?? emptyArray;
    const notes = storedState.notes ?? emptyArray;
    const configDefaultTaskType = storedState.configDefaultTaskType ?? 'development';
    const configDefaultTaskStatus = storedState.configDefaultTaskStatus ?? 'done';
    const configAllowMultipleEntry = storedState.configAllowMultipleEntry ?? false;
    const configEditingMode = storedState.configEditingMode ?? 'normal';
    const configFocusMode = storedState.configFocusMode ?? false;

    // Write to stored state
    const setWorkItems: Dispatch<SetStateAction<WorkItem[]>> = useCallback(
        (func) => {
            setStoredState((oldValue) => ({
                ...oldValue,
                workItems: typeof func === 'function'
                    ? func(oldValue.workItems)
                    : func,
            }));
        },
        [setStoredState],
    );
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
        setWorkItems(myTimeEntriesResult.data?.private.myTimeEntries ?? []);
    }, [myTimeEntriesResult, setWorkItems]);

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
        (taskId: number) => {
            const newId = getNewId();
            console.info(newId);

            /*
            setWorkItems((oldWorkItems = []) => ([
                ...oldWorkItems,
                {
                    id: newId,
                    task: taskId,
                    type: configDefaultTaskType,
                    status: configDefaultTaskStatus,
                    date: selectedDate,
                },
            ]));
            */

            focus(String(newId));
        },
        [setWorkItems, selectedDate, configDefaultTaskType, configDefaultTaskStatus, focus],
    );

    const handleWorkItemClone = useCallback(
        (workItemId: number) => {
            const newId = getNewId();
            setWorkItems((oldWorkItems) => {
                if (isNotDefined(oldWorkItems)) {
                    return oldWorkItems;
                }

                const sourceItemIndex = oldWorkItems
                    .findIndex(({ id }) => workItemId === id);
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

                return newWorkItems;
            });
            focus(String(newId));
        },
        [setWorkItems, focus],
    );

    const handleWorkItemDelete = useCallback(
        (workItemId: number) => {
            setWorkItems((oldWorkItems) => {
                if (isNotDefined(oldWorkItems)) {
                    return oldWorkItems;
                }

                const sourceItemIndex = oldWorkItems
                    .findIndex(({ id }) => workItemId === id);
                if (sourceItemIndex === -1) {
                    return oldWorkItems;
                }

                const newWorkItems = [...oldWorkItems];
                newWorkItems.splice(sourceItemIndex, 1);

                return newWorkItems;
            });
        },
        [setWorkItems],
    );

    const handleWorkItemChange = useCallback(
        (workItemId: number, ...entries: EntriesAsList<WorkItem>) => {
            setWorkItems((oldWorkItems) => {
                if (isNotDefined(oldWorkItems)) {
                    return oldWorkItems;
                }

                const sourceItemIndex = oldWorkItems
                    .findIndex(({ id }) => workItemId === id);
                if (sourceItemIndex === -1) {
                    return oldWorkItems;
                }

                const obsoleteWorkItem = oldWorkItems[sourceItemIndex];
                const newWorkItem = {
                    ...obsoleteWorkItem,
                    [entries[1]]: entries[0],
                };

                if (
                    isDefined(newWorkItem.hours)
                    && newWorkItem.hours > 0
                    && obsoleteWorkItem.hours !== newWorkItem.hours
                    && newWorkItem.status === 'todo'
                ) {
                    newWorkItem.status = 'doing';
                }

                const newWorkItems = [...oldWorkItems];
                newWorkItems.splice(
                    sourceItemIndex,
                    1,
                    newWorkItem,
                );

                return newWorkItems;
            });
        },
        [setWorkItems],
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
        (content: string | undefined, noteId: number | undefined) => {
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

            const groupedWorkItems = mapToList(listToGroupList(
                workItems,
                (workItem) => workItem.task.contract.project.id,
                undefined,
                (list) => ({
                    project: list[0].task.contract.project,
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
        [workItems],
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
