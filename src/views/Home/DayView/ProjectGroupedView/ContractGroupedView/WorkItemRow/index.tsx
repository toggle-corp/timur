import {
    useCallback,
    useContext,
    useMemo,
} from 'react';
import {
    FcClock,
    FcDocument,
    FcPackage,
    FcPieChart,
    FcRuler,
} from 'react-icons/fc';
import {
    IoCopyOutline,
    IoTrashOutline,
} from 'react-icons/io5';
import { _cs } from '@togglecorp/fujs';

import Button from '#components/Button';
import DurationInput from '#components/DurationInput';
import SelectInput from '#components/SelectInput';
import TextArea from '#components/TextArea';
import EnumsContext from '#contexts/enums';
import { EnumsQuery } from '#generated/types/graphql';
import { useFocusClient } from '#hooks/useFocus';
import {
    Contract,
    EntriesAsList,
    Task,
    WorkItem,
} from '#utils/types';

import styles from './styles.module.css';

type WorkItemTypeOption = EnumsQuery['enums']['TimeEntryType'][number];
type WorkItemStatusOption = EnumsQuery['enums']['TimeEntryStatus'][number];

function taskKeySelector(item: Task) {
    return item.id;
}
function taskLabelSelector(item: Task) {
    return item.name;
}
function workItemTypeKeySelector(item: WorkItemTypeOption) {
    return item.key;
}
function workItemTypeLabelSelector(item: WorkItemTypeOption) {
    return item.label;
}
function workItemStatusKeySelector(item: WorkItemStatusOption) {
    return item.key;
}
function workItemStatusLabelSelector(item: WorkItemStatusOption) {
    return item.label;
}

export interface Props {
    className?: string;
    workItem: WorkItem;
    contract: Contract;

    onClone: (clientId: string) => void;
    onChange: (clientId: string, ...entries: EntriesAsList<WorkItem>) => void;
    onDelete: (clientId: string) => void;
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

    const { enums } = useContext(EnumsContext);
    const inputRef = useFocusClient<HTMLTextAreaElement>(workItem.clientId);

    const setFieldValue = useCallback(
        (...entries: EntriesAsList<WorkItem>) => {
            onChange(workItem.clientId, ...entries);
        },
        [workItem.clientId, onChange],
    );

    const filteredTaskList = useMemo(
        () => enums?.private?.allActiveTasks?.filter((task) => task.contract.id === contract.id),
        [contract.id, enums],
    );

    return (
        <div
            role="listitem"
            className={_cs(styles.workItemRow, className, focusMode && styles.focusMode)}
        >
            <SelectInput
                className={styles.status}
                name="status"
                options={enums?.enums?.TimeEntryStatus}
                keySelector={workItemStatusKeySelector}
                labelSelector={workItemStatusLabelSelector}
                onChange={setFieldValue}
                value={workItem.status}
                nonClearable
                icons={(
                    <FcPieChart />
                )}
            />
            {!focusMode && (
                <SelectInput
                    className={styles.task}
                    name="task"
                    options={filteredTaskList}
                    keySelector={taskKeySelector}
                    labelSelector={taskLabelSelector}
                    onChange={setFieldValue}
                    value={workItem.task}
                    nonClearable
                    icons={(
                        <FcPackage />
                    )}
                />
            )}
            <TextArea<'description'>
                className={styles.description}
                inputElementRef={inputRef}
                name="description"
                title="Description"
                value={workItem.description}
                onChange={setFieldValue}
                icons={(
                    <FcDocument />
                )}
                placeholder="Description"
            />
            {!focusMode && (
                <>
                    <SelectInput
                        className={styles.type}
                        name="type"
                        options={enums?.enums.TimeEntryType}
                        keySelector={workItemTypeKeySelector}
                        labelSelector={workItemTypeLabelSelector}
                        onChange={setFieldValue}
                        value={workItem.type}
                        nonClearable
                        icons={(
                            <FcRuler />
                        )}
                    />
                    <DurationInput
                        className={styles.hours}
                        name="duration"
                        title="Hours"
                        value={workItem.duration}
                        onChange={setFieldValue}
                        icons={(
                            <FcClock />
                        )}
                        placeholder="hh:mm"
                    />
                    <div className={styles.actions}>
                        <Button
                            name={workItem.clientId}
                            variant="secondary"
                            title="Clone this entry"
                            onClick={onClone}
                            spacing="sm"
                        >
                            <IoCopyOutline />
                        </Button>
                        <Button
                            name={workItem.clientId}
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
