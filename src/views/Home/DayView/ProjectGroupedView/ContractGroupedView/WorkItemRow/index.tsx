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
import { useFocusClient } from '#hooks/useFocus';
import {
    Contract,
    EntriesAsList,
    Task,
    WorkItem,
    WorkItemStatus,
    WorkItemType,
} from '#utils/types';

import {
    statusOptions,
    taskList,
    typeOptions,
} from '../../../../data';

import styles from './styles.module.css';

type WorkItemTypeOption = { id: WorkItemType, title: string };
type WorkItemStatusOption = { id: WorkItemStatus, title: string };

function taskKeySelector(item: Task) {
    return item.id;
}
function taskLabelSelector(item: Task) {
    return item.title;
}
function workItemTypeKeySelector(item: WorkItemTypeOption) {
    return item.id;
}
function workItemTypeLabelSelector(item: WorkItemTypeOption) {
    return item.title;
}
function workItemStatusKeySelector(item: WorkItemStatusOption) {
    return item.id;
}
function workItemStatusLabelSelector(item: WorkItemStatusOption) {
    return item.title;
}

export interface Props {
    className?: string;
    workItem: WorkItem;
    contract: Contract;

    onClone: (id: number) => void;
    onChange: (id: number, ...entries: EntriesAsList<WorkItem>) => void;
    onDelete: (id: number) => void;
    focusMode: boolean;
}

function WorkItemRow(props: Props) {
    const {
        className,
        workItem,
        contract,
        onClone,
        onDelete,
        onChange,
        focusMode,
    } = props;

    const inputRef = useFocusClient<HTMLTextAreaElement>(String(workItem.id));

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
            className={_cs(styles.workItemRow, className, focusMode && styles.focusMode)}
        >
            {!focusMode && (
                <>
                    <SelectInput
                        className={styles.task}
                        name="task"
                        options={taskListByContract}
                        keySelector={taskKeySelector}
                        labelSelector={taskLabelSelector}
                        onChange={setFieldValue}
                        value={workItem.task}
                        nonClearable
                        icons="🧘"
                    />
                    <SelectInput
                        className={styles.type}
                        name="type"
                        options={typeOptions}
                        keySelector={workItemTypeKeySelector}
                        labelSelector={workItemTypeLabelSelector}
                        onChange={setFieldValue}
                        value={workItem.type}
                        nonClearable
                        icons="📐"
                    />
                </>
            )}
            <SelectInput
                className={styles.status}
                name="status"
                options={statusOptions}
                keySelector={workItemStatusKeySelector}
                labelSelector={workItemStatusLabelSelector}
                onChange={setFieldValue}
                value={workItem.status}
                nonClearable
                icons="🪩"
            />
            <TextArea<'description'>
                className={styles.description}
                inputElementRef={inputRef}
                name="description"
                title="Description"
                value={workItem.description}
                onChange={setFieldValue}
                icons="🗒️"
                placeholder="Description"
            />
            {!focusMode && (
                <>
                    <DurationInput
                        className={styles.hours}
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
                </>
            )}
        </div>
    );
}

export default WorkItemRow;
