import {
    KeyboardEvent,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import {
    RiDeleteBin2Line,
    RiFileCopyLine,
    RiMoreLine,
    RiSwap2Line,
} from 'react-icons/ri';
import {
    _cs,
    isDefined,
    unique,
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
import DateContext from '#contexts/date';
import EnumsContext from '#contexts/enums';
import SizeContext from '#contexts/size';
import { EnumsQuery } from '#generated/types/graphql';
import { useFocusClient } from '#hooks/useFocus';
import useLocalStorage from '#hooks/useLocalStorage';
import { fuzzySearch } from '#utils/common';
import { colorscheme } from '#utils/constants';
import {
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
function taskDescriptionSelector(item: Task) {
    const { contract } = item;
    const { project } = contract;
    return `${project.name} › ${contract.name}`;
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
function workItemStatusColorSelector(item: WorkItemStatusOption): readonly [string, string] {
    if (item.key === 'DOING') {
        return colorscheme[1];
    }
    if (item.key === 'DONE') {
        return colorscheme[5];
    }
    return colorscheme[7];
}

function defaultColorSelector<T>(_: T, i: number): readonly [string, string] {
    // NOTE: This is safe as we the index is bounded
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return colorscheme[i % colorscheme.length]!;
}

interface Props {
    className?: string;
    workItem: WorkItem;
    tasks: Task[] | undefined;

    typeErrored?: boolean;
    durationErrored?: boolean;

    onClone?: (clientId: string, override?: Partial<WorkItem>) => void;
    onAssist?: (clientId: string) => void;
    onChange?: (clientId: string, ...entries: EntriesAsList<WorkItem>) => void;
    onDelete?: (clientId: string) => void;
}

function WorkItemRow(props: Props) {
    const {
        className,
        workItem,
        tasks,
        onClone,
        onAssist,
        onDelete,
        onChange,
        typeErrored,
        durationErrored,
    } = props;

    const { enums } = useContext(EnumsContext);
    const { screen } = useContext(SizeContext);

    const inputRef = useFocusClient<HTMLTextAreaElement>(workItem.clientId);
    const [config] = useLocalStorage('timur-config');

    const setFieldValue = useCallback(
        (...entries: EntriesAsList<WorkItem>) => {
            if (onChange) {
                onChange(workItem.clientId, ...entries);
            }
        },
        [workItem.clientId, onChange],
    );

    const taskList: Task[] = useMemo(
        () => (
            unique(
                [
                    ...enums?.private?.allActiveTasks ?? [],
                    ...tasks ?? [],
                ],
                (item) => item.id,
            )
        ),
        [enums, tasks],
    );

    // FIXME: re-use this
    const filterTaskList = useCallback(
        (items: Task[], value: string | undefined | null): Task[] => {
            if (!value) {
                return items;
            }
            return fuzzySearch(
                items,
                value,
                {
                    keys: [
                        (task) => task.name,
                        (task) => task.contract.name,
                        (task) => task.contract.project.name,
                        (task) => task.contract.project.projectClient.name,
                    ],
                },
            );
        },
        [],
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
            } else if (dialogState === 'copy' && onClone) {
                onClone(workItem.clientId, { date: newValue });
            }
            setDialogState(undefined);
        },
        [onClone, setFieldValue, dialogState, workItem.clientId],
    );

    const handleClone = useCallback(
        () => {
            if (onClone) {
                onClone(workItem.clientId);
            }
        },
        [onClone, workItem.clientId],
    );

    const handleShortcuts = useCallback(
        (event: KeyboardEvent<HTMLTextAreaElement>) => {
            if (event.ctrlKey && event.key === 'Enter' && onAssist) {
                event.preventDefault();
                event.stopPropagation();
                onAssist(workItem.clientId);
            }
        },
        [onAssist, workItem.clientId],
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
        />
    );

    const taskInput = (
        <SelectInput
            className={styles.task}
            name="task"
            options={taskList}
            keySelector={taskKeySelector}
            labelSelector={taskLabelSelector}
            descriptionSelector={taskDescriptionSelector}
            onChange={setFieldValue}
            sortFunction={filterTaskList}
            value={workItem.task}
            nonClearable
        />
    );

    const descriptionInput = (
        <TextArea
            className={styles.description}
            inputClassName={_cs(
                config.enableStrikethrough && workItem.status === 'DONE' && styles.strike,
            )}
            inputElementRef={inputRef}
            name="description"
            title="Description"
            value={workItem.description}
            onChange={setFieldValue}
            onKeyDown={handleShortcuts}
            placeholder="Description"
            compact={config.compactTextArea}
        />
    );

    const typeInput = (
        <SelectInput
            className={_cs(styles.type, typeErrored && styles.erroredInput)}
            name="type"
            placeholder="Type"
            options={enums?.enums.TimeEntryType}
            keySelector={workItemTypeKeySelector}
            labelSelector={workItemTypeLabelSelector}
            colorSelector={defaultColorSelector}
            onChange={setFieldValue}
            value={workItem.type}
        />
    );

    const durationInput = (
        <DurationInput
            className={_cs(styles.hours, durationErrored && styles.erroredInput)}
            name="duration"
            title="Hours"
            value={workItem.duration}
            onChange={setFieldValue}
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
                <RiFileCopyLine />
            </Button>
            <DropdownMenu
                label={<RiMoreLine />}
                withoutDropdownIcon
                variant="transparent"
                title="Show additional entry options"
            >
                <DropdownMenuItem
                    type="button"
                    name={workItem.clientId}
                    title="Move this entry to another day"
                    onClick={handleCopyDialogOpen}
                    icons={<RiFileCopyLine />}
                >
                    Copy to another day
                </DropdownMenuItem>
                <DropdownMenuItem
                    type="button"
                    name={workItem.clientId}
                    title="Move this entry to another day"
                    onClick={handleMoveDialogOpen}
                    icons={<RiSwap2Line />}
                >
                    Move to another day
                </DropdownMenuItem>
                <DropdownMenuItem
                    type="button"
                    name={workItem.clientId}
                    title="Delete this entry"
                    onClick={onDelete}
                    icons={<RiDeleteBin2Line />}
                >
                    Delete entry
                </DropdownMenuItem>
            </DropdownMenu>
        </div>
    );

    const { year, month } = useContext(DateContext);

    return (
        <>
            <div
                role="listitem"
                className={_cs(
                    styles.workItemRow,
                    config.checkboxForStatus && styles.checkboxForStatus,
                    className,
                )}
            >
                {screen === 'desktop' ? (
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
                heading={dialogState === 'move' ? 'Move to' : 'Copy to'}
                contentClassName={styles.modalContent}
                className={styles.calendarDialog}
                size="auto"
                closeOnOutsideClick
            >
                <MonthlyCalendar
                    selectedDate={workItem.date}
                    initialYear={workItem.date ? new Date(workItem.date).getFullYear() : year}
                    initialMonth={workItem.date ? new Date(workItem.date).getMonth() : month}
                    onDateClick={handleMoveOrCopyEntry}
                />
            </Dialog>
        </>
    );
}

export default WorkItemRow;
