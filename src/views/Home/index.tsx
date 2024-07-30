/* FIXME: remove this */
/* eslint-disable max-len */
import {
    useCallback,
    useMemo,
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
    Client,
    Contract,
    Project,
    Task,
    WorkItem,
    WorkItemType,
} from '#utils/types';

import styles from './styles.module.css';

function numericIdSelector({ id }: { id: number }) {
    return id;
}

function stringTitleSelector({ title }: { title: string }) {
    return title;
}

const togglecorp: Client = {
    id: 1,
    title: 'Togglecorp',
};
const ifrc: Client = {
    id: 2,
    title: 'IFRC',
};

const clientList: Client[] = [
    togglecorp,
    ifrc,
];
const clientById = listToMap(clientList, ({ id }) => id);

const timur: Project = {
    id: 1,
    title: 'Timur Development',
    client: togglecorp.id,
};
const go: Project = {
    id: 2,
    title: 'GO',
    client: ifrc.id,
};

const projectList: Project[] = [
    timur,
    go,
];
const projectById = listToMap(projectList, ({ id }) => id);

const phaseOneDevelopment: Contract = {
    id: 1,
    title: 'Phase I Development',
    project: timur.id,
};
const drefDevelopment: Contract = {
    id: 2,
    title: 'DREF',
    project: go.id,
};
const opsLearning: Contract = {
    id: 3,
    title: 'Ops. learning',
    project: go.id,
};

const contractList: Contract[] = [
    phaseOneDevelopment,
    drefDevelopment,
    opsLearning,
];

const contractById = listToMap(contractList, ({ id }) => id);

const uiSetup: Task = {
    id: 1,
    title: 'Setup UI',
    contract: phaseOneDevelopment.id,
};
const templateSchema: Task = {
    id: 2,
    title: 'Template Schema',
    contract: drefDevelopment.id,
};
const importTemplate: Task = {
    id: 3,
    title: 'Import from template',
    contract: drefDevelopment.id,
};
const uiUpdate: Task = {
    id: 4,
    title: 'Update UI',
    contract: drefDevelopment.id,
};
const openAiSetup: Task = {
    id: 5,
    title: 'Setup connection to OpenAI',
    contract: opsLearning.id,
};

const taskList: Task[] = [
    uiSetup,
    templateSchema,
    importTemplate,
    uiUpdate,
    openAiSetup,
];

const taskById = listToMap(taskList, ({ id }) => id);

function getNewId() {
    return Math.round(Math.random() * 10000);
}

const userWorkItems: WorkItem[] = [
    {
        id: 1,
        task: uiSetup.id,
        hour: 5,
        description: 'Discuss about the implementation',
        type: 'internal-discussion',
        date: '2024-08-01',
    },
    {
        id: 2,
        task: uiSetup.id,
        hour: 2,
        type: 'development',
        description: 'Add basic UI components',
        date: '2024-08-01',
    },
    {
        id: 3,
        task: templateSchema.id,
        hour: 1,
        type: 'internal-discussion',
        description: 'Discuss with Safar about the schema for template generation',
        date: '2024-08-01',
    },
    {
        id: 4,
        task: templateSchema.id,
        hour: 8,
        type: 'development',
        description: 'Add typings for template schema',
        date: '2024-08-01',
    },
    {
        id: getNewId(),
        task: templateSchema.id,
        hour: 8,
        type: 'development',
        description: 'Add typings for template schema',
        date: '2024-07-30',
    },
    {
        id: 5,
        task: templateSchema.id,
        hour: 4,
        type: 'development',
        description: 'Add fields for the import template',
        date: '2024-08-01',
    },
    {
        id: 6,
        task: importTemplate.id,
        hour: 10,
        type: 'development',
        description: 'Create a function to transform imported xlsx to the form fields',
        date: '2024-08-01',
    },
    {
        id: 7,
        task: uiUpdate.id,
        hour: 2,
        type: 'development',
        description: 'Add download button and modal to import the template',
        date: '2024-08-01',
    },
    {
        id: 8,
        task: openAiSetup.id,
        hour: 6,
        type: 'development',
        description: 'Establish connection with OpenAI server',
        date: '2024-08-01',
    },
];

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

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [workItems, setWorkItems] = useState<WorkItem[] | undefined>(userWorkItems);
    const [showAddWorkItemDialog, setShowAddWorkItemDialog] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | undefined>(() => encodeDate(new Date()));
    const [searchText, setSearchText] = useState<string | undefined>();

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
            };

            const newWorkItems = [...oldWorkItems];
            newWorkItems.splice(sourceItemIndex, 0, targetItem);

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

    return (
        <Page
            documentTitle="Timur - Home"
            className={styles.home}
            contentClassName={styles.content}
        >
            <div className={styles.pageHeader}>
                <DateInput
                    label="Date"
                    name={undefined}
                    value={selectedDate}
                    onChange={setSelectedDate}
                />
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
                                                                value={workItem.hour}
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
            <div>
                <Button
                    name
                    onClick={setShowAddWorkItemDialog}
                >
                    Add workitem
                </Button>
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
