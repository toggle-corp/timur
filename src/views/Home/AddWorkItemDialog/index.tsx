import {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { IoAddSharp } from 'react-icons/io5';
import {
    isDefined,
    listToGroupList,
} from '@togglecorp/fujs';
import {
    matchSorter,
    type MatchSorterOptions,
} from 'match-sorter';

import Dialog from '#components/Dialog';
import RawButton from '#components/RawButton';
import SelectInput from '#components/SelectInput';
import TextInput from '#components/TextInput';
import EnumsContext from '#contexts/enums';
import { EnumsQuery } from '#generated/types/graphql';
import {
    WorkItem,
    WorkItemStatus,
    WorkItemType,
} from '#utils/types';

import styles from './styles.module.css';

function fuzzySearch<ItemType = string>(
    rows: ReadonlyArray<ItemType>,
    filterValue: string,
    options?: MatchSorterOptions<ItemType>,
) {
    if (!filterValue || filterValue.length <= 0) {
        return rows;
    }

    const terms = filterValue.split(' ');
    if (!terms) {
        return rows;
    }

    // reduceRight will mean sorting is done by score for the _first_ entered word.
    return terms.reduceRight(
        (results, term) => matchSorter(results, term, options),
        rows,
    );
}

type WorkItemTypeOption = EnumsQuery['enums']['TimeEntryType'][number];
function workItemTypeKeySelector(item: WorkItemTypeOption) {
    return item.key;
}
function workItemTypeLabelSelector(item: WorkItemTypeOption) {
    return item.label;
}

type WorkItemStatusOption = EnumsQuery['enums']['TimeEntryStatus'][number];
function workItemStatusKeySelector(item: WorkItemStatusOption) {
    return item.key;
}
function workItemStatusLabelSelector(item: WorkItemStatusOption) {
    return item.label;
}

type BoolStr = 'true' | 'false';

type ModeOption = { id: BoolStr, title: string };
function modeKeySelector(item: ModeOption) {
    return item.id;
}
function modeLabelSelector(item: ModeOption) {
    return item.title;
}
const modeOptions: ModeOption[] = [
    { id: 'false', title: 'Single' },
    { id: 'true', title: 'Multiple' },
];

interface Props {
    dialogOpenTriggerRef: React.MutableRefObject<(() => void) | undefined>;
    workItems: WorkItem[] | undefined;
    onWorkItemCreate: (taskId: string) => void;
    defaultTaskType: WorkItemType;
    onDefaultTaskTypeChange: React.Dispatch<React.SetStateAction<WorkItemType>>
    defaultTaskStatus: WorkItemStatus;
    onDefaultTaskStatusChange: React.Dispatch<React.SetStateAction<WorkItemStatus>>
    allowMultipleEntry: boolean;
    onAllowMultipleEntryChange: React.Dispatch<React.SetStateAction<boolean>>
}

function AddWorkItemDialog(props: Props) {
    const {
        dialogOpenTriggerRef,
        workItems,
        onWorkItemCreate,
        defaultTaskType,
        onDefaultTaskTypeChange,
        defaultTaskStatus,
        onDefaultTaskStatusChange,
        allowMultipleEntry,
        onAllowMultipleEntryChange,
    } = props;

    const [showAddWorkItemDialog, setShowAddWorkItemDialog] = useState(false);
    const [searchText, setSearchText] = useState<string | undefined>();
    const titleInputRef = useRef<HTMLInputElement>(null);

    const taskCountMapping = useMemo(
        () => listToGroupList(
            workItems,
            (item) => item.task,
            undefined,
            (items) => items.length,
        ),
        [workItems],
    );

    useEffect(() => {
        dialogOpenTriggerRef.current = () => {
            setShowAddWorkItemDialog(true);
        };
    }, [dialogOpenTriggerRef]);

    const handleModalClose = useCallback(() => {
        setShowAddWorkItemDialog(false);
        setSearchText(undefined);
    }, []);

    const handleWorkItemCreate = useCallback(
        (taskId: string) => {
            onWorkItemCreate(taskId);
            if (!allowMultipleEntry) {
                handleModalClose();
            }
        },
        [onWorkItemCreate, handleModalClose, allowMultipleEntry],
    );

    const handleModeChange = useCallback(
        (value: BoolStr | undefined) => {
            onAllowMultipleEntryChange(value === 'true');
        },
        [onAllowMultipleEntryChange],
    );

    const { enums } = useContext(EnumsContext);

    const filteredTaskList = useMemo(
        () => fuzzySearch(
            enums?.private.allActiveTasks ?? [],
            searchText ?? '',
            {
                keys: [
                    (task) => task.name,
                    (task) => task.contract.name,
                    (task) => task.contract.project.name,
                    (task) => task.contract.project.projectClient.name,
                    // (task) => task.contract.project.client.abbvr,
                ],
            },
        ),
        [searchText, enums],
    );

    return (
        <Dialog
            open={showAddWorkItemDialog}
            mode={allowMultipleEntry ? 'right' : 'center'}
            onClose={handleModalClose}
            heading="Add new entry"
            contentClassName={styles.modalContent}
            className={styles.addWorkItemDialog}
            focusElementRef={titleInputRef}
        >
            <SelectInput
                name="type"
                label="Mode"
                options={modeOptions}
                keySelector={modeKeySelector}
                labelSelector={modeLabelSelector}
                onChange={handleModeChange}
                value={isDefined(allowMultipleEntry)
                    ? String(allowMultipleEntry) as BoolStr
                    : undefined}
                variant="general"
                nonClearable
            />
            <SelectInput
                name="type"
                label="Default Type"
                options={enums?.enums.TimeEntryType}
                keySelector={workItemTypeKeySelector}
                labelSelector={workItemTypeLabelSelector}
                onChange={onDefaultTaskTypeChange}
                value={defaultTaskType}
                variant="general"
                nonClearable
            />
            <SelectInput
                name="type"
                label="Default Status"
                options={enums?.enums.TimeEntryStatus}
                keySelector={workItemStatusKeySelector}
                labelSelector={workItemStatusLabelSelector}
                onChange={onDefaultTaskStatusChange}
                value={defaultTaskStatus}
                variant="general"
                nonClearable
            />
            <div>
                Please select a task to add the workitems
            </div>
            <TextInput
                inputElementRef={titleInputRef}
                label="Search by title"
                name={undefined}
                value={searchText}
                variant="general"
                onChange={setSearchText}
            />
            <div
                role="list"
                className={styles.taskList}
            >
                {filteredTaskList.map((task) => {
                    const { contract } = task;
                    const { project } = contract;
                    const { projectClient } = project;
                    const count = taskCountMapping?.[task.id] ?? 0;

                    return (
                        <RawButton
                            className={styles.task}
                            role="listitem"
                            name={task.id}
                            onClick={handleWorkItemCreate}
                            key={task.id}
                        >
                            <IoAddSharp className={styles.icon} />
                            <div className={styles.details}>
                                {task.name}
                                <div className={styles.meta}>
                                    <div className={styles.badge}>
                                        {projectClient.name}
                                    </div>
                                    <div className={styles.badge}>
                                        {project.name}
                                    </div>
                                    <div className={styles.badge}>
                                        {contract.name}
                                    </div>
                                </div>
                            </div>
                            {count > 0 && (
                                <div className={styles.usageCount}>
                                    {count}
                                </div>
                            )}
                        </RawButton>
                    );
                })}
            </div>
        </Dialog>
    );
}

export default AddWorkItemDialog;
