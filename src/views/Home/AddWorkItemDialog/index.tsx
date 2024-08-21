import {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { IoAddSharp } from 'react-icons/io5';
import { listToGroupList } from '@togglecorp/fujs';

import Dialog from '#components/Dialog';
import RawButton from '#components/RawButton';
import TextInput from '#components/TextInput';
import EnumsContext from '#contexts/enums';
import { fuzzySearch } from '#utils/common';
import { WorkItem } from '#utils/types';

import styles from './styles.module.css';
import DisplayPicture from '#components/DisplayPicture';

interface Props {
    dialogOpenTriggerRef: React.MutableRefObject<(() => void) | undefined>;
    workItems: WorkItem[] | undefined;
    onWorkItemCreate: (taskId: string) => void;
    allowMultipleEntry: boolean;
}

function AddWorkItemDialog(props: Props) {
    const {
        dialogOpenTriggerRef,
        workItems,
        onWorkItemCreate,
        allowMultipleEntry,
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
                            <DisplayPicture
                                className={styles.displayPicture}
                                imageUrl={project.logo?.url}
                                displayName={project.name}
                            />
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
