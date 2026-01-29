import {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    RiDeleteBin2Line,
    RiFileCopyLine,
} from 'react-icons/ri';
import {
    TbCalendarPlus,
    TbCalendarRepeat,
} from 'react-icons/tb';
import {
    _cs,
    isDefined,
    unique,
} from '@togglecorp/fujs';

import Button from '#components/Button';
import Checkbox from '#components/Checkbox';
import ConfirmButton from '#components/ConfirmButton';
import Dialog from '#components/Dialog';
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

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noOp = () => {};

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
    contractId: string | undefined;
    isExpanded?: boolean;
    onToggleExpand?: (clientId: string | undefined) => void;

    onClone?: (clientId: string, override?: Partial<WorkItem>) => void;
    onChange?: (clientId: string, ...entries: EntriesAsList<WorkItem>) => void;
    onDelete?: (clientId: string) => void;
}

function WorkItemRow(props: Props) {
    const {
        className,
        workItem,
        tasks,
        contractId,
        isExpanded = false,
        onToggleExpand,
        onClone,
        onDelete,
        onChange,
    } = props;

    const { enums } = useContext(EnumsContext);
    const { screen } = useContext(SizeContext);

    const inputRef = useFocusClient<HTMLTextAreaElement>(workItem.clientId);
    const rowRef = useRef<HTMLDivElement>(null);
    const [config] = useLocalStorage('timur-config');

    const setFieldValue = useCallback(
        (...entries: EntriesAsList<WorkItem>) => {
            if (onChange) {
                onChange(workItem.clientId, ...entries);
            }
        },
        [workItem.clientId, onChange],
    );

    const filteredTaskList = useMemo(
        () => (
            unique(
                [
                    ...enums?.private?.allActiveTasks ?? [],
                    ...tasks ?? [],
                ],
                (item) => item.id,
            ).filter(
                (task) => task.contract.id === contractId,
            )
        ),
        [contractId, enums, tasks],
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

    const handleToggleExpand = useCallback(() => {
        if (screen !== 'desktop' && onToggleExpand) {
            onToggleExpand(workItem.clientId);
        }
    }, [screen, onToggleExpand, workItem.clientId]);

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
            options={filteredTaskList}
            keySelector={taskKeySelector}
            labelSelector={taskLabelSelector}
            onChange={setFieldValue}
            value={workItem.task}
            nonClearable
        />
    );

    const descriptionInput = (
        <div
            className={styles.descriptionWrapper}
            onClick={handleToggleExpand}
            onKeyDown={noOp}
            role="button"
            tabIndex={0}
        >
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
                placeholder="Description"
                compact={config.compactTextArea}
            />
        </div>
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
        />
    );

    const durationInput = (
        <DurationInput
            className={styles.hours}
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
            <Button
                variant="quaternary"
                name={workItem.clientId}
                title="Copy this entry to another day"
                onClick={handleCopyDialogOpen}
                spacing="xs"
            >
                <TbCalendarPlus />
            </Button>
            <Button
                name={workItem.clientId}
                variant="quaternary"
                title="Move this entry to another day"
                onClick={handleMoveDialogOpen}
                spacing="xs"
            >
                <TbCalendarRepeat />
            </Button>
            <ConfirmButton
                name={workItem.clientId}
                title="Delete this entry"
                onClick={onDelete}
                confirmHeading="Delete entry"
                variant="quaternary"
                spacing="xs"
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
            >
                <RiDeleteBin2Line />
            </ConfirmButton>
        </div>
    );

    const { year, month } = useContext(DateContext);

    useEffect(() => {
        if (screen !== 'desktop' && isExpanded && onToggleExpand) {
            const handleClickOutside = (e: MouseEvent) => {
                const target = e.target as HTMLElement;

                // Check if click is outside this row
                if (rowRef.current && !rowRef.current.contains(target)) {
                    // Check if the click is on another work item row
                    const clickedOnAnotherWorkItem = target.closest(`.${styles.workItemRow}`);

                    // Only close if NOT clicking on another work item
                    if (!clickedOnAnotherWorkItem) {
                        onToggleExpand(undefined);
                    }
                }
            };

            // Add listener on next tick to avoid immediate closure
            setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 0);

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
        return undefined;
    }, [screen, isExpanded, onToggleExpand]);

    return (
        <>
            <div
                ref={rowRef}
                role="listitem"
                className={_cs(
                    styles.workItemRow,
                    config.checkboxForStatus && styles.checkboxForStatus,
                    isExpanded && styles.expanded,
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
                heading={dialogState === 'move' ? 'Move to another day' : 'Clone to another day'}
                contentClassName={styles.modalContent}
                className={styles.calendarDialog}
                size="auto"
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
