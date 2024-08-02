import {
    useCallback,
    useEffect,
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
} from '@togglecorp/fujs';

import Button from '#components/Button';
import DateInput from '#components/DateInput';
import Page from '#components/Page';
import {
    getFromStorage,
    setToStorage,
} from '#utils/localStorage';
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

function addDays(dateStr: string, numDays: number) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + numDays);

    return encodeDate(date);
}

const dateFormatter = new Intl.DateTimeFormat(
    [],
    {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
    },
);

function useKeybind(callback: (event: KeyboardEvent) => void) {
    useEffect(
        () => {
            document.addEventListener('keydown', callback);
            return () => {
                document.removeEventListener('keydown', callback);
            };
        },
        [callback],
    );
}

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [workItems, setWorkItems] = useState<WorkItem[]>(
        () => getFromStorage<{ appVersion: string, workItems: WorkItem[] }>(
            KEY_DATA_STORAGE,
        )?.workItems ?? [],
    );
    const [selectedDate, setSelectedDate] = useState<string | undefined>(
        () => encodeDate(new Date()),
    );

    const dateInputRef = useRef<HTMLInputElement>(null);

    const dialogOpenTriggerRef = useRef<(() => void) | undefined>(
        () => () => {
            // eslint-disable-next-line no-console
            console.info('Handler not attached');
        });

    const syncTimeoutRef = useRef<number | undefined>();

    useEffect(() => {
        function updateLocalstorage() {
            setToStorage(
                KEY_DATA_STORAGE,
                {
                    appVersion: APP_VERSION,
                    workItems,
                },
            );
        }

        window.clearTimeout(syncTimeoutRef.current);

        syncTimeoutRef.current = window.setTimeout(
            updateLocalstorage,
            500,
        );
    }, [workItems]);

    const currentWorkItems = useMemo(() => (
        workItems.filter(({ date }) => date === selectedDate)
    ), [workItems, selectedDate]);

    const handleCopyTextClick = useCallback(() => {
        function toSubItem(subItem: string | undefined) {
            return `  - ${subItem ?? '??'}`;
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
                        name={undefined}
                        variant="tertiary"
                        onClick={handleDateClick}
                        actions={<IoChevronDown />}
                    >
                        {formattedDate}
                    </Button>
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
            />
        </Page>
    );
}

Component.displayName = 'Home';
