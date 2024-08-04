import {
    type Dispatch,
    type SetStateAction,
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    IoChevronBackSharp,
    IoChevronDown,
    IoChevronForwardSharp,
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

import Button from '#components/Button';
import DateInput from '#components/DateInput';
import Page from '#components/Page';
import useKeybind from '#hooks/useKeybind';
import useLocalStorage from '#hooks/useLocalStorage';
import {
    addDays,
    getDurationString,
    getNewId,
} from '#utils/common';
import {
    EntriesAsList,
    WorkItem,
} from '#utils/types';

import AddWorkItemDialog from './AddWorkItemDialog';
import {
    contractById,
    projectById,
    taskById,
} from './data';
import DayView from './DayView';

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

const today = new Date();
const emptyArray: unknown[] = [];

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [storedState, setStoredState] = useLocalStorage<{
        appVersion: string,
        workItems: WorkItem[],

        configDefaultTaskType: string,
        configAllowMultipleEntry: boolean;
    }>(
        KEY_DATA_STORAGE,
        {
            appVersion: APP_VERSION,
            workItems: [],
            configDefaultTaskType: 'development',
            configAllowMultipleEntry: false,
        },
    );

    const [
        selectedDate,
        setSelectedDate,
    ] = useState<string | undefined>(
        () => encodeDate(today),
    );

    // NOTE: We are hiding the native dateinput and triggering calender popup
    // using a separate button
    const dateInputRef = useRef<HTMLInputElement>(null);
    // NOTE: We are opening the dialog from this parent component
    const dialogOpenTriggerRef = useRef<(() => void) | undefined>();

    // Read state from the stored state
    const workItems = storedState.workItems ?? emptyArray;
    const configDefaultTaskType = storedState.configDefaultTaskType ?? 'development';
    const configAllowMultipleEntry = storedState.configAllowMultipleEntry ?? false;

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
    const setDefaultTaskType: Dispatch<SetStateAction<string>> = useCallback(
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

    const currentWorkItems = useMemo(
        () => (
            workItems.filter(({ date }) => date === selectedDate)
        ),
        [workItems, selectedDate],
    );

    const handleWorkItemClone = useCallback(
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

                const targetItem = {
                    ...oldWorkItems[sourceItemIndex],
                    id: getNewId(),
                    description: undefined,
                    hours: undefined,
                };

                const newWorkItems = [...oldWorkItems];
                newWorkItems.splice(sourceItemIndex + 1, 0, targetItem);

                return newWorkItems;
            });
        },
        [setWorkItems],
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

                const newWorkItems = [...oldWorkItems];
                newWorkItems.splice(
                    sourceItemIndex,
                    1,
                    { ...obsoleteWorkItem, [entries[1]]: entries[0] },
                );

                return newWorkItems;
            });
        },
        [setWorkItems],
    );

    const handleCopyTextButtonClick = useCallback(
        () => {
            function toSubItem(subItem: string | undefined) {
                const safeSubItem = subItem ?? '??';
                return safeSubItem
                    .split('\n')
                    .map((item, i) => (i === 0 ? `  - ${item}` : `    ${item}`))
                    .join('\n');
            }

            const groupedWorkItems = mapToList(listToGroupList(
                currentWorkItems,
                (workItem) => contractById[taskById[workItem.task].contract].project,
                undefined,
                (list, projectId) => ({
                    project: projectById[Number(projectId)],
                    workItems: list,
                }),
            ));

            const text = groupedWorkItems.map((projectGrouped) => {
                const { project, workItems: projectWorkItems } = projectGrouped;

                return `- ${project.title}\n${projectWorkItems.map((workItem) => toSubItem(workItem.description)).join('\n')}`;
            }).join('\n');

            if (isFalsyString(text)) {
                return;
            }

            window.navigator.clipboard.writeText(text);
        },
        [currentWorkItems],
    );

    const handleAddWorkItemClick = useCallback(
        () => {
            if (dialogOpenTriggerRef.current) {
                dialogOpenTriggerRef.current();
            }
        },
        [],
    );

    const handleDateButtonClick = useCallback(
        () => {
            dateInputRef.current?.showPicker();
        },
        [],
    );

    const handleCtrlSpacePress = useCallback(
        (event: KeyboardEvent) => {
            if (event.ctrlKey && event.code === 'Space') {
                handleAddWorkItemClick();
            }
        },
        [handleAddWorkItemClick],
    );

    useKeybind(handleCtrlSpacePress);

    const formattedDate = dateFormatter.format(
        selectedDate ? new Date(selectedDate) : undefined,
    );

    const totalHours = useMemo(
        () => (
            sum(currentWorkItems.map((item) => item.hours).filter(isDefined))
        ),
        [currentWorkItems],
    );

    return (
        <Page
            documentTitle="Timur - Home"
            className={styles.home}
            contentClassName={styles.content}
        >
            <div className={styles.pageHeader}>
                <div className={styles.headerContent}>
                    {isDefined(selectedDate) && (
                        <Button
                            name={addDays(selectedDate, -1)}
                            onClick={setSelectedDate}
                            variant="secondary"
                            title="Previous day"
                        >
                            <IoChevronBackSharp />
                        </Button>
                    )}
                    {isDefined(selectedDate) && (
                        <Button
                            name={addDays(selectedDate, 1)}
                            onClick={setSelectedDate}
                            variant="secondary"
                            title="Next day"
                        >
                            <IoChevronForwardSharp />
                        </Button>
                    )}
                    <DateInput
                        inputElementRef={dateInputRef}
                        className={styles.dateInput}
                        name={undefined}
                        value={selectedDate}
                        onChange={setSelectedDate}
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
                    <div>
                        ⏱️
                        {' '}
                        {getDurationString(totalHours)}
                    </div>
                </div>
                <div className={styles.actions}>
                    <Button
                        name={undefined}
                        onClick={handleCopyTextButtonClick}
                        variant="secondary"
                        disabled={currentWorkItems.length === 0}
                    >
                        Copy standup text
                    </Button>
                    <Button
                        name
                        onClick={handleAddWorkItemClick}
                    >
                        Add entry
                    </Button>
                </div>
            </div>
            <DayView
                workItems={currentWorkItems}
                onWorkItemClone={handleWorkItemClone}
                onWorkItemChange={handleWorkItemChange}
                onWorkItemDelete={handleWorkItemDelete}
            />
            <AddWorkItemDialog
                workItems={currentWorkItems}
                selectedDate={selectedDate}
                setWorkItems={setWorkItems}
                dialogOpenTriggerRef={dialogOpenTriggerRef}
                defaultTaskType={configDefaultTaskType}
                allowMultipleEntry={configAllowMultipleEntry}
                onDefaultTaskTypeChange={setDefaultTaskType}
                onAllowMultipleEntryChange={setAllowMultipleEntryChange}
            />
        </Page>
    );
}

Component.displayName = 'Home';
