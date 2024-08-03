import {
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
} from '#utils/common';
import { WorkItem } from '#utils/types';

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
    const dialogOpenTriggerRef = useRef<(() => void) | undefined>(
        () => () => {
            // eslint-disable-next-line no-console
            console.info('Handler not attached');
        });

    const workItems = storedState.workItems ?? emptyArray;
    const configDefaultTaskType = storedState.configDefaultTaskType ?? 'development';
    const configAllowMultipleEntry = storedState.configAllowMultipleEntry ?? false;

    const setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>> = useCallback(
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
    const setDefaultTaskType: React.Dispatch<React.SetStateAction<string>> = useCallback(
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
    const setAllowMultipleEntryChange: React.Dispatch<React.SetStateAction<boolean>> = useCallback(
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

    const currentWorkItems = useMemo(() => (
        workItems.filter(({ date }) => date === selectedDate)
    ), [workItems, selectedDate]);

    const totalHours = sum(
        currentWorkItems.map((item) => item.hours).filter(isDefined),
    );

    const handleCopyTextClick = useCallback(() => {
        function toSubItem(subItem: string | undefined) {
            const safeSubItem = subItem ?? '??';
            return safeSubItem
                .split('\n')
                .map((item, i) => (i === 0 ? `  - ${item}` : `    ${item}`))
                .join('\n');
        }

        const groupedWorkItems = mapToList(
            listToGroupList(
                currentWorkItems,
                (workItem) => contractById[taskById[workItem.task].contract].project,
            ),
            (list, projectId) => ({
                project: projectById[Number(projectId)],
                workItems: list,
            }),
        );

        const text = groupedWorkItems.map((projectGrouped) => {
            const { project, workItems: projectWorkItems } = projectGrouped;

            return `- ${project.title}\n${projectWorkItems.map((workItem) => toSubItem(workItem.description)).join('\n')}`;
        }).join('\n');

        if (isFalsyString(text)) {
            return;
        }

        window.navigator.clipboard.writeText(text);
    }, [currentWorkItems]);

    const handleAddWorkItemClick = useCallback(() => {
        if (dialogOpenTriggerRef.current) {
            dialogOpenTriggerRef.current();
        }
    }, []);

    const handleDateClick = useCallback(() => {
        dateInputRef.current?.showPicker();
    }, []);

    const formattedDate = dateFormatter.format(
        selectedDate
            ? new Date(selectedDate)
            : undefined,
    );

    const handleCtrlSpace = useCallback(
        (event: KeyboardEvent) => {
            if (event.ctrlKey && event.code === 'Space') {
                handleAddWorkItemClick();
            }
        },
        [handleAddWorkItemClick],
    );

    useKeybind(handleCtrlSpace);

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
                        onClick={handleDateClick}
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
                        onClick={handleCopyTextClick}
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
                date={selectedDate}
                workItems={workItems}
                setWorkItems={setWorkItems}
            />
            <AddWorkItemDialog
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
