/* FIXME: remove this */
/* eslint-disable max-len */
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    IoAddSharp,
    IoCopyOutline,
    IoTrashOutline,
} from 'react-icons/io5';
import {
    encodeDate,
    isDefined,
    isFalsyString,
    isNotDefined,
    listToGroupList,
    listToMap,
    mapToList,
} from '@togglecorp/fujs';

import Button from '#components/Button';
import DateInput from '#components/DateInput';
import Dialog from '#components/Dialog';
import NumberInput from '#components/NumberInput';
import Page from '#components/Page';
import RawButton from '#components/RawButton';
import SelectInput from '#components/SelectInput';
import TextInput from '#components/TextInput';
import { rankedSearchOnList } from '#utils/common';
import {
    getFromStorage,
    setToStorage,
} from '#utils/localStorage';
import {
    WorkItem,
    WorkItemType,
} from '#utils/types';

import {
    clientList,
    contractList,
    projectList,
    taskList,
} from './data';

import styles from './styles.module.css';

const { APP_VERSION } = import.meta.env;

function numericIdSelector({ id }: { id: number }) {
    return id;
}

function stringTitleSelector({ title }: { title: string }) {
    return title;
}

const clientById = listToMap(clientList, ({ id }) => id);
const projectById = listToMap(projectList, ({ id }) => id);
const contractById = listToMap(contractList, ({ id }) => id);
const taskById = listToMap(taskList, ({ id }) => id);

function getNewId() {
    return Math.round(Math.random() * 10000);
}

type WorkItemTypeOption = { id: WorkItemType, title: string };
const typeOptions: WorkItemTypeOption[] = [
    { id: 'design', title: 'Design' },
    { id: 'development', title: 'Development' },
    { id: 'qa', title: 'QA' },
    { id: 'devops', title: 'DevOps' },
    { id: 'documentation', title: 'Documentation' },
    { id: 'meeting', title: 'Meeting' },
    { id: 'internal-discussion', title: 'Internal discussion' },
];

const KEY_DATA_STORAGE = 'timur';

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [workItems, setWorkItems] = useState<WorkItem[] | undefined>(
        () => getFromStorage<{ appVersion: string, workItems: WorkItem[] }>(KEY_DATA_STORAGE)?.workItems,
    );
    const [showAddWorkItemDialog, setShowAddWorkItemDialog] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | undefined>(() => encodeDate(new Date()));
    const [searchText, setSearchText] = useState<string | undefined>();

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

    const getWorkItemUpdateFunction = useCallback((workItemId: number | undefined) => {
        function updateWorkItem(newValue: WorkItemType, name: 'type'): void
        function updateWorkItem(newValue: string | undefined, name: 'description'): void
        function updateWorkItem(newValue: number | undefined, name: 'task' | 'hours'): void
        function updateWorkItem(newValue: WorkItemType | string | number | undefined, name: 'type' | 'description' | 'task' | 'hours'): void {
            setWorkItems((oldWorkItems) => {
                if (isNotDefined(oldWorkItems) || isNotDefined(workItemId)) {
                    return oldWorkItems;
                }

                const newWorkItems = [...oldWorkItems];
                const obsoleteWorkItemIndex = newWorkItems.findIndex(({ id }) => id === workItemId);
                const obsoleteWorkItem = newWorkItems[obsoleteWorkItemIndex];

                if (isNotDefined(obsoleteWorkItem)) {
                    return oldWorkItems;
                }

                newWorkItems.splice(
                    obsoleteWorkItemIndex,
                    1,
                    { ...obsoleteWorkItem, [name]: newValue },
                );

                return newWorkItems;
            });
        }

        return updateWorkItem;
    }, []);

    const groupedWorkItems = useMemo(
        () => {
            if (isNotDefined(workItems)) {
                return undefined;
            }

            return mapToList(
                listToGroupList(
                    mapToList(
                        listToGroupList(
                            workItems.filter(({ date }) => date === selectedDate),
                            (workItem) => contractById[taskById[workItem.task].contract].id,
                        ),
                        (list) => ({
                            contract: contractById[taskById[list[0].task].contract],
                            workItems: list,
                        }),
                    ),
                    (contractGrouped) => contractGrouped.contract.project,
                ),
                (list) => ({
                    project: projectById[list[0].contract.project],
                    contracts: list,
                }),
            );
        },
        [workItems, selectedDate],
    );

    const taskListByContract = useMemo(() => (
        listToGroupList(taskList, ({ contract }) => contract)
    ), []);

    const handleTaskAddClick = useCallback((taskId: number) => {
        setWorkItems((oldWorkItems) => ([
            ...(oldWorkItems ?? []),
            {
                id: getNewId(),
                task: taskId,
                type: 'development',
                date: selectedDate ?? encodeDate(new Date()),
            } satisfies WorkItem,
        ]));
    }, [selectedDate]);

    const handleCloneWorkItemClick = useCallback((workItemId: number) => {
        setWorkItems((oldWorkItems) => {
            if (isNotDefined(oldWorkItems)) {
                return oldWorkItems;
            }

            const sourceItemIndex = oldWorkItems.findIndex(({ id }) => workItemId === id);
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
    }, []);

    const handleDeleteWorkItemClick = useCallback((workItemId: number) => {
        setWorkItems((oldWorkItems) => {
            if (isNotDefined(oldWorkItems)) {
                return oldWorkItems;
            }

            const obsoleteWorkItemIndex = oldWorkItems.findIndex(({ id }) => workItemId === id);
            if (obsoleteWorkItemIndex === -1) {
                return oldWorkItems;
            }

            const newWorkItems = [...oldWorkItems];
            newWorkItems.splice(obsoleteWorkItemIndex, 1);

            return newWorkItems;
        });
    }, []);

    const handleCopyTextClick = useCallback(() => {
        function toSubItem(subItem: string | undefined) {
            return `  - ${subItem ?? '??'}`;
        }

        const text = groupedWorkItems?.map((projectGrouped) => {
            const { project, contracts } = projectGrouped;
            const currentWorkItems = contracts.flatMap(({ workItems: contractGroupedWorkItems }) => contractGroupedWorkItems);

            return `- ${project.title}\n${currentWorkItems.map((workItem) => toSubItem(workItem.description)).join('\n')}`;
        }).join('\n');

        if (isFalsyString(text)) {
            return;
        }

        window.navigator.clipboard.writeText(text);
    }, [groupedWorkItems]);

    return (
        <Page
            documentTitle="Timur - Home"
            className={styles.home}
            contentClassName={styles.content}
        >
            <div className={styles.pageHeader}>
                <div className={styles.headerContent}>
                    <DateInput
                        // label="Date"
                        className={styles.dateInput}
                        name={undefined}
                        value={selectedDate}
                        onChange={setSelectedDate}
                    />
                </div>
                <div className={styles.actions}>
                    <Button
                        name={undefined}
                        onClick={handleCopyTextClick}
                        variant="secondary"
                    >
                        Copy standup text
                    </Button>
                    <Button
                        name
                        onClick={setShowAddWorkItemDialog}
                    >
                        Add workitem
                    </Button>
                </div>
            </div>
            <div
                role="list"
                className={styles.projectGroupedList}
            >
                {/* TODO: use List form mapping */}
                {groupedWorkItems?.map((projectGrouped) => {
                    const {
                        project,
                        contracts,
                    } = projectGrouped;

                    return (
                        <section
                            key={project.id}
                            role="listitem"
                            className={styles.projectGroupedItem}
                        >
                            <h2 className={styles.projectTitle}>
                                {project.title}
                            </h2>
                            <hr className={styles.separator} />
                            <div
                                role="list"
                                className={styles.contractGroupedList}
                            >
                                {/* TODO: use List form mapping */}
                                {contracts.map((contractGrouped) => {
                                    const {
                                        contract,
                                        workItems: currentWorkItems,
                                    } = contractGrouped;

                                    return (
                                        <section
                                            role="listitem"
                                            key={contract.id}
                                            className={styles.contractGroupedItem}
                                        >
                                            <h3 className={styles.contractTitle}>
                                                {contract.title}
                                            </h3>
                                            <div
                                                className={styles.workItemList}
                                                role="list"
                                            >
                                                {/* TODO: use List form mapping */}
                                                {currentWorkItems.filter(isDefined).map((workItem) => {
                                                    const setFieldValue = getWorkItemUpdateFunction(workItem.id);

                                                    return (
                                                        <div
                                                            role="listitem"
                                                            key={workItem.id}
                                                            className={styles.workItem}
                                                        >
                                                            <SelectInput
                                                                name="task"
                                                                label="Task"
                                                                options={taskListByContract[contract.id]}
                                                                keySelector={numericIdSelector}
                                                                labelSelector={stringTitleSelector}
                                                                onChange={setFieldValue}
                                                                value={workItem.task}
                                                                nonClearable
                                                                autoFocus
                                                            />
                                                            <SelectInput<WorkItemType, 'type', WorkItemTypeOption, never>
                                                                name="type"
                                                                label="Type"
                                                                options={typeOptions}
                                                                keySelector={({ id }) => id}
                                                                labelSelector={stringTitleSelector}
                                                                onChange={setFieldValue}
                                                                value={workItem.type}
                                                                nonClearable
                                                            />
                                                            <TextInput<'description'>
                                                                name="description"
                                                                label="Description"
                                                                value={workItem.description}
                                                                onChange={setFieldValue}
                                                            />
                                                            <NumberInput
                                                                name="hours"
                                                                label="Hours"
                                                                value={workItem.hours}
                                                                onChange={setFieldValue}
                                                            />
                                                            <div className={styles.actions}>
                                                                <Button
                                                                    name={workItem.id}
                                                                    variant="secondary"
                                                                    spacing="xs"
                                                                    title="Clone this workitem"
                                                                    onClick={handleCloneWorkItemClick}
                                                                >
                                                                    <IoCopyOutline />
                                                                </Button>
                                                                <Button
                                                                    name={workItem.id}
                                                                    variant="secondary"
                                                                    spacing="xs"
                                                                    title="Delete this workitem"
                                                                    onClick={handleDeleteWorkItemClick}
                                                                >
                                                                    <IoTrashOutline />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}
            </div>
            {/* TODO: Move to separate component */}
            <Dialog
                open={showAddWorkItemDialog}
                onClose={setShowAddWorkItemDialog}
                heading="Add new work item"
                contentClassName={styles.modalContent}
                className={styles.newWorkItemDialog}
            >
                <div>
                    Please select a task to add the workitem
                </div>
                <TextInput
                    label="Search by title"
                    name={undefined}
                    value={searchText}
                    onChange={setSearchText}
                />
                <div
                    role="list"
                    className={styles.taskList}
                >
                    {/* TODO: useMemo for search, use List form mapping */}
                    {rankedSearchOnList(taskList, searchText, ({ title }) => title).map((task) => {
                        const contract = contractById[task.contract];
                        const project = projectById[contract.project];
                        const client = clientById[project.client];

                        return (
                            <RawButton
                                className={styles.task}
                                role="listitem"
                                name={task.id}
                                onClick={handleTaskAddClick}
                                key={task.id}
                            >
                                <IoAddSharp className={styles.icon} />
                                <div className={styles.details}>
                                    <div>
                                        {task.title}
                                    </div>
                                    <div className={styles.meta}>
                                        <div>
                                            {contract.title}
                                        </div>
                                        <div>
                                            {project.title}
                                        </div>
                                        <div>
                                            {client.title}
                                        </div>
                                    </div>
                                </div>
                            </RawButton>
                        );
                    })}
                </div>
            </Dialog>
        </Page>
    );
}

Component.displayName = 'Home';
