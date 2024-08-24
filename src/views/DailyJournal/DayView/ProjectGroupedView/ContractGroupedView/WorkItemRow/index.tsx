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
    IoEllipsisVertical,
    IoTrashOutline,
} from 'react-icons/io5';
import { _cs } from '@togglecorp/fujs';

import Button from '#components/Button';
import Checkbox from '#components/Checkbox';
import DropdownMenu from '#components/DropdownMenu';
import DropdownMenuItem from '#components/DropdownMenuItem';
import DurationInput from '#components/DurationInput';
import SelectInput from '#components/SelectInput';
import TextArea from '#components/TextArea';
import EnumsContext from '#contexts/enums';
import SizeContext from '#contexts/size';
import { EnumsQuery } from '#generated/types/graphql';
import { useFocusClient } from '#hooks/useFocus';
import useLocalStorage from '#hooks/useLocalStorage';
import {
    defaultConfigValue,
    KEY_CONFIG_STORAGE,
} from '#utils/constants';
import {
    Contract,
    EntriesAsList,
    Task,
    WorkItem,
    WorkItemStatus,
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

    const { enums } = useContext(EnumsContext);
    const { width: windowWidth } = useContext(SizeContext);
    const inputRef = useFocusClient<HTMLTextAreaElement>(workItem.clientId);
    const [config] = useLocalStorage(KEY_CONFIG_STORAGE, defaultConfigValue);

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

    const handleStatusCheck = useCallback(() => {
        const newValueMap: Record<WorkItemStatus, WorkItemStatus> = {
            TODO: 'DOING',
            DOING: 'DONE',
            DONE: 'TODO',
        };

        setFieldValue(
            newValueMap[workItem.status],
            'status',
        );
    }, [workItem.status, setFieldValue]);

    const statusInput = config.checkboxForStatus ? (
        <Checkbox
            className={_cs(
                styles.statusCheckbox,
                workItem.status === 'DOING' && styles.doing,
                workItem.status === 'DONE' && styles.done,
            )}
            name="status"
            indeterminate={workItem.status === 'DOING'}
            value={workItem.status === 'DONE'}
            onChange={handleStatusCheck}
        />
    ) : (
        <SelectInput
            className={styles.status}
            name="status"
            options={enums?.enums?.TimeEntryStatus}
            keySelector={workItemStatusKeySelector}
            labelSelector={workItemStatusLabelSelector}
            onChange={setFieldValue}
            value={workItem.status}
            nonClearable
            icons={config.showInputIcons && <FcPieChart />}
        />
    );

    const taskInput = (
        <SelectInput
            className={styles.task}
            name="task"
            options={filteredTaskList}
            keySelector={taskKeySelector}
            labelSelector={taskLabelSelector}
            onChange={setFieldValue}
            value={workItem.task}
            nonClearable
            icons={config.showInputIcons && <FcPackage />}
        />
    );

    const descriptionInput = (
        <TextArea<'description'>
            className={styles.description}
            inputElementRef={inputRef}
            name="description"
            title="Description"
            value={workItem.description}
            onChange={setFieldValue}
            icons={config.showInputIcons && <FcDocument />}
            placeholder="Description"
            compact={windowWidth >= 900}
        />
    );

    const typeInput = (
        <SelectInput
            className={styles.type}
            name="type"
            options={enums?.enums.TimeEntryType}
            keySelector={workItemTypeKeySelector}
            labelSelector={workItemTypeLabelSelector}
            onChange={setFieldValue}
            value={workItem.type}
            nonClearable
            icons={config.showInputIcons && <FcRuler />}
        />
    );

    const durationInput = (
        <DurationInput
            className={styles.hours}
            name="duration"
            title="Hours"
            value={workItem.duration}
            onChange={setFieldValue}
            icons={config.showInputIcons && <FcClock />}
            placeholder="hh:mm"
        />
    );

    const actions = (
        <div className={styles.actions}>
            <Button
                name={workItem.clientId}
                variant="secondary"
                title="Clone this entry"
                onClick={onClone}
                spacing="xs"
            >
                <IoCopyOutline />
            </Button>
            <DropdownMenu
                label={<IoEllipsisVertical />}
                withoutDropdownIcon
                variant="tertiary"
                persistent
            >
                <DropdownMenuItem
                    type="confirm-button"
                    name={workItem.clientId}
                    title="Delete this entry"
                    onClick={onDelete}
                    confirmHeading="Delete entry"
                    confirmDescription={(
                        <div>
                            <p>
                                Do you want to delete this entry?
                            </p>
                            <p>
                                This action cannot be reverted.
                            </p>
                        </div>
                    )}
                    icons={<IoTrashOutline />}
                >
                    Delete
                </DropdownMenuItem>
            </DropdownMenu>
        </div>
    );

    return (
        <div
            role="listitem"
            className={_cs(
                styles.workItemRow,
                config.checkboxForStatus && styles.checkboxForStatus,
                config.showInputIcons && styles.withIcons,
                className,
            )}
        >
            {windowWidth >= 900 ? (
                <>
                    {statusInput}
                    {taskInput}
                    {descriptionInput}
                    {typeInput}
                    {durationInput}
                    {actions}
                </>
            ) : (
                <>
                    {config.checkboxForStatus && statusInput}
                    {descriptionInput}
                    <div className={styles.compactOptions}>
                        {!config.checkboxForStatus && statusInput}
                        {taskInput}
                        {typeInput}
                        {durationInput}
                        {actions}
                    </div>
                </>
            )}
        </div>
    );
}

export default WorkItemRow;
