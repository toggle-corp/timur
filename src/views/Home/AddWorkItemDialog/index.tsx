import {
    useCallback,
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

import Dialog from '#components/Dialog';
import RawButton from '#components/RawButton';
import SelectInput from '#components/SelectInput';
import TextInput from '#components/TextInput';
import { rankedSearchOnList } from '#utils/common';
import {
    WorkItem,
    WorkItemType,
} from '#utils/types';

import {
    clientById,
    contractById,
    projectById,
    taskList,
    typeOptions,
} from '../data';

import styles from './styles.module.css';

type WorkItemTypeOption = { id: WorkItemType, title: string };
function workItemTypeKeySelector(item: WorkItemTypeOption) {
    return item.id;
}
function workItemTypeLabelSelector(item: WorkItemTypeOption) {
    return item.title;
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
    onWorkItemCreate: (taskId: number) => void;
    defaultTaskType: WorkItemType;
    onDefaultTaskTypeChange: React.Dispatch<React.SetStateAction<WorkItemType>>
    allowMultipleEntry: boolean;
    onAllowMultipleEntryChange: React.Dispatch<React.SetStateAction<boolean>>
}

function AddWorkItemDialog(props: Props) {
    const {
        dialogOpenTriggerRef,
        workItems,
        onWorkItemCreate,
        defaultTaskType,
        allowMultipleEntry,
        onDefaultTaskTypeChange,
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
        (taskId: number) => {
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
                options={typeOptions}
                keySelector={workItemTypeKeySelector}
                labelSelector={workItemTypeLabelSelector}
                onChange={onDefaultTaskTypeChange}
                value={defaultTaskType}
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
                {/* TODO: useMemo for search, use List form mapping */}
                {rankedSearchOnList(
                    taskList,
                    searchText,
                    ({ title, contract }) => {
                        const contractObj = contractById[contract];
                        const projectObj = projectById[contractObj.project];
                        const clientObj = clientById[projectObj.client];

                        return [
                            title,
                            contractObj?.title,
                            projectObj?.title,
                            clientObj?.title,
                            clientObj?.abbvr,
                        ].filter(isDefined).join(' - ');
                    },
                ).map((task) => {
                    const contract = contractById[task.contract];
                    const project = projectById[contract.project];
                    const client = clientById[project.client];
                    // FIXME: show count in better way
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
                                {task.title}
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
