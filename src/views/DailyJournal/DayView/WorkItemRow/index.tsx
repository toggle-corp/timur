import {
    useCallback,
    useContext,
    useMemo,
    useState,
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
    IoPencilOutline,
    IoSwapHorizontal,
    IoTrashOutline,
} from 'react-icons/io5';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';

import Button from '#components/Button';
import Checkbox from '#components/Checkbox';
import Dialog from '#components/Dialog';
import DropdownMenu from '#components/DropdownMenu';
import DropdownMenuItem from '#components/DropdownMenuItem';
import DurationInput from '#components/DurationInput';
import MonthlyCalendar from '#components/MonthlyCalendar';
import SelectInput from '#components/SelectInput';
import TextArea from '#components/TextArea';
import EnumsContext from '#contexts/enums';
import SizeContext from '#contexts/size';
import { EnumsQuery } from '#generated/types/graphql';
import { useFocusClient } from '#hooks/useFocus';
import useLocalStorage from '#hooks/useLocalStorage';
import { colorscheme } from '#utils/constants';
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
function workItemStatusColorSelector(item: WorkItemStatusOption): [string, string] {
    if (item.key === 'DOING') {
        return colorscheme[1];
    }
    if (item.key === 'DONE') {
        return colorscheme[5];
    }
    return colorscheme[7];
}

function defaultColorSelector<T>(_: T, i: number): [string, string] {
    return colorscheme[i % colorscheme.length];
}

export interface Props {
    className?: string;
    workItem: WorkItem;
    contract: Contract;

    onClone: (clientId: string, override?: Partial<WorkItem>) => void;
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
    const [config] = useLocalStorage('timur-config');

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

    const [dialogState, setDialogState] = useState<'move' | 'copy' | undefined>(undefined);

    const handleMoveDialogOpen = useCallback(
        () => {
            setDialogState('move');
        },
        [],
    );

    const handleCopyDialogOpen = useCallback(
        () => {
            setDialogState('copy');
        },
        [],
    );

    const handleDialogClose = useCallback(
        () => {
            setDialogState(undefined);
        },
        [],
    );

    const handleMoveOrCopyEntry = useCallback(
        (newValue: string) => {
            if (dialogState === 'move') {
                setFieldValue(newValue, 'date');
            } else if (dialogState === 'copy') {
                onClone(workItem.clientId, { date: newValue });
            }
            setDialogState(undefined);
        },
        [onClone, setFieldValue, dialogState, workItem.clientId],
    );

    const handleClone = useCallback(
        () => {
            onClone(workItem.clientId);
        },
        [onClone, workItem.clientId],
    );

    const statusInput = config.checkboxForStatus ? (
        <Checkbox
            checkmarkClassName={_cs(
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
            colorSelector={workItemStatusColorSelector}
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
            // colorSelector={defaultColorSelector}
            onChange={setFieldValue}
            value={workItem.task}
            nonClearable
            icons={(
                config.showInputIcons
                // NOTE: hide/unhide icon wrt "checkbox for status" flag
                && (windowWidth < 900 || !config.checkboxForStatus)
                && <FcPackage />
            )}
        />
    );

    const descriptionInput = (
        <TextArea
            className={styles.description}
            inputElementRef={inputRef}
            name="description"
            title="Description"
            value={workItem.description}
            onChange={setFieldValue}
            icons={(
                config.showInputIcons
                // NOTE: hide/unhide icon wrt "checkbox for status" flag
                && (windowWidth >= 900 || !config.checkboxForStatus)
                && <FcDocument />
            )}
            placeholder="Description"
            compact={config.compactTextArea}
        />
    );

    const typeInput = (
        <SelectInput
            className={styles.type}
            name="type"
            placeholder="Type"
            options={enums?.enums.TimeEntryType}
            keySelector={workItemTypeKeySelector}
            labelSelector={workItemTypeLabelSelector}
            colorSelector={defaultColorSelector}
            onChange={setFieldValue}
            value={workItem.type}
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
                name={undefined}
                variant="quaternary"
                title="Clone this entry"
                onClick={handleClone}
                spacing="xs"
            >
                <IoCopyOutline />
            </Button>
            <DropdownMenu
                label={<IoEllipsisVertical />}
                withoutDropdownIcon
                variant="transparent"
                persistent
                title="Show additional entry options"
            >
                <DropdownMenuItem
                    type="button"
                    name={workItem.clientId}
                    title="Edit this entry"
                    onClick={undefined}
                    icons={<IoPencilOutline />}
                    disabled
                >
                    Edit entry
                </DropdownMenuItem>
                <DropdownMenuItem
                    type="button"
                    name={workItem.clientId}
                    title="Move this entry to another day"
                    onClick={handleCopyDialogOpen}
                    icons={<IoCopyOutline />}
                >
                    Copy to another day
                </DropdownMenuItem>
                <DropdownMenuItem
                    type="button"
                    name={workItem.clientId}
                    title="Move this entry to another day"
                    onClick={handleMoveDialogOpen}
                    icons={<IoSwapHorizontal />}
                >
                    Move to another day
                </DropdownMenuItem>
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
                    Delete entry
                </DropdownMenuItem>
            </DropdownMenu>
        </div>
    );

    const today = new Date();
    const selectedDate = isDefined(workItem.date)
        ? new Date(workItem.date)
        : today;

    return (
        <>
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
            <Dialog
                open={isDefined(dialogState)}
                mode="center"
                onClose={handleDialogClose}
                heading="Select date"
                contentClassName={styles.modalContent}
                className={styles.calendarDialog}
                size="auto"
            >
                <MonthlyCalendar
                    selectedDate={workItem.date}
                    initialYear={selectedDate.getFullYear()}
                    initialMonth={selectedDate.getMonth()}
                    onDateClick={handleMoveOrCopyEntry}
                />
            </Dialog>
        </>
    );
}

export default WorkItemRow;
