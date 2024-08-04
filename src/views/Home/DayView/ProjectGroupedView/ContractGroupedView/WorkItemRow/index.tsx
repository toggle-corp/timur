import {
    useCallback,
    useMemo,
} from 'react';
import {
    IoCopyOutline,
    IoTrashOutline,
} from 'react-icons/io5';
import { _cs } from '@togglecorp/fujs';

import Button from '#components/Button';
import DurationInput from '#components/DurationInput';
import SelectInput from '#components/SelectInput';
import TextArea from '#components/TextArea';
import {
    numericIdSelector,
    stringIdSelector,
    stringTitleSelector,
} from '#utils/common';
import {
    Contract,
    EntriesAsList,
    WorkItem,
    WorkItemType,
} from '#utils/types';

import { taskList } from '../../../../data';

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

export interface Props {
    className?: string;
    workItem: WorkItem;
    contract: Contract;

    onClone: (id: number) => void;
    onChange: (id: number, ...entries: EntriesAsList<WorkItem>) => void;
    onDelete: (id: number) => void;
}

function WorkItemRow(props: Props) {
    const {
        className,
        workItem,
        contract,
        onClone,
        onDelete,
        onChange,
    } = props;

    const setFieldValue = useCallback(
        (...entries: EntriesAsList<WorkItem>) => {
            onChange(workItem.id, ...entries);
        },
        [workItem.id, onChange],
    );

    const taskListByContract = useMemo(
        () => taskList.filter((task) => task.contract === contract.id),
        [contract.id],
    );

    return (
        <div
            role="listitem"
            className={_cs(styles.workItemRow, className)}
        >
            <SelectInput
                name="task"
                options={taskListByContract}
                keySelector={numericIdSelector}
                labelSelector={stringTitleSelector}
                onChange={setFieldValue}
                value={workItem.task}
                nonClearable
                icons="🧘"
            />
            <SelectInput<WorkItemType, 'type', WorkItemTypeOption, never>
                name="type"
                // title="Type"
                options={typeOptions}
                keySelector={stringIdSelector}
                labelSelector={stringTitleSelector}
                onChange={setFieldValue}
                value={workItem.type}
                nonClearable
                icons="📐"
            />
            <TextArea<'description'>
                name="description"
                title="Description"
                value={workItem.description}
                onChange={setFieldValue}
                icons="🗒️"
                placeholder="Description"
            />
            <DurationInput
                name="hours"
                title="Hours"
                value={workItem.hours}
                onChange={setFieldValue}
                icons="⏱️"
                placeholder="hh:mm"
            />
            <div className={styles.actions}>
                <Button
                    name={workItem.id}
                    variant="secondary"
                    title="Clone this entry"
                    onClick={onClone}
                    spacing="sm"
                >
                    <IoCopyOutline />
                </Button>
                <Button
                    name={workItem.id}
                    variant="secondary"
                    spacing="sm"
                    title="Delete this entry"
                    onClick={onDelete}
                >
                    <IoTrashOutline />
                </Button>
            </div>
        </div>
    );
}

export default WorkItemRow;
