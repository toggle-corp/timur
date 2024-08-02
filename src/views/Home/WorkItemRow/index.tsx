import {
    useCallback,
    useMemo,
} from 'react';
import {
    IoCopyOutline,
    IoTrashOutline,
} from 'react-icons/io5';
import {
    _cs,
    isNotDefined,
    listToGroupList,
} from '@togglecorp/fujs';

import Button from '#components/Button';
import NumberInput from '#components/NumberInput';
import SelectInput from '#components/SelectInput';
import TextInput from '#components/TextInput';
import {
    getNewId,
    numericIdSelector,
    stringTitleSelector,
} from '#utils/common';
import {
    Contract,
    WorkItem,
    WorkItemType,
} from '#utils/types';

import { taskList } from '../data';

import styles from './styles.module.css';

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

const taskListByContract = listToGroupList(taskList, ({ contract }) => contract);

export interface Props {
    className?: string;
    workItem: WorkItem;
    contract: Contract;
    setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
}

function WorkItemRow(props: Props) {
    const {
        className,
        workItem,
        contract,
        setWorkItems,
    } = props;

    const setFieldValue = useMemo(() => {
        function updateWorkItem(newValue: WorkItemType, name: 'type'): void
        function updateWorkItem(newValue: string | undefined, name: 'description'): void
        function updateWorkItem(newValue: number | undefined, name: 'task' | 'hours'): void
        function updateWorkItem(newValue: WorkItemType | string | number | undefined, name: 'type' | 'description' | 'task' | 'hours'): void {
            setWorkItems((oldWorkItems) => {
                if (isNotDefined(oldWorkItems) || isNotDefined(workItem.id)) {
                    return oldWorkItems;
                }

                const newWorkItems = [...oldWorkItems];
                const obsoleteWorkItemIndex = newWorkItems.findIndex(
                    ({ id }) => id === workItem.id,
                );
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
    }, [workItem, setWorkItems]);

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
    }, [setWorkItems]);

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
    }, [setWorkItems]);

    return (
        <div
            role="listitem"
            className={_cs(styles.workItemRow, className)}
        >
            <SelectInput
                name="task"
                // title="Task"
                options={taskListByContract[contract.id]}
                keySelector={numericIdSelector}
                labelSelector={stringTitleSelector}
                onChange={setFieldValue}
                value={workItem.task}
                nonClearable
                autoFocus
                icons="🧘"
            />
            <SelectInput<WorkItemType, 'type', WorkItemTypeOption, never>
                name="type"
                // title="Type"
                options={typeOptions}
                keySelector={({ id }) => id}
                labelSelector={stringTitleSelector}
                onChange={setFieldValue}
                value={workItem.type}
                nonClearable
                icons="📐"
            />
            <TextInput<'description'>
                name="description"
                title="Description"
                value={workItem.description}
                onChange={setFieldValue}
                icons="🗒️"
                placeholder="Description"
            />
            <NumberInput
                name="hours"
                title="Hours"
                value={workItem.hours}
                onChange={setFieldValue}
                icons="⏱️"
                placeholder="hrs"
            />
            <div className={styles.actions}>
                <Button
                    name={workItem.id}
                    variant="secondary"
                    title="Clone this workitem"
                    onClick={handleCloneWorkItemClick}
                    spacing="sm"
                >
                    <IoCopyOutline />
                </Button>
                <Button
                    name={workItem.id}
                    variant="secondary"
                    spacing="sm"
                    title="Delete this workitem"
                    onClick={handleDeleteWorkItemClick}
                >
                    <IoTrashOutline />
                </Button>
            </div>
        </div>
    );
}

export default WorkItemRow;
