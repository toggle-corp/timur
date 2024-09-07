import {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { RiSearchLine } from 'react-icons/ri';
import { listToGroupList } from '@togglecorp/fujs';

import Dialog from '#components/Dialog';
import DisplayPicture from '#components/DisplayPicture';
import RawButton from '#components/RawButton';
import TextInput from '#components/TextInput';
import EnumsContext from '#contexts/enums';
import { fuzzySearch } from '#utils/common';
import { WorkItem } from '#utils/types';

import styles from './styles.module.css';

interface Props {
    dialogOpenTriggerRef: React.MutableRefObject<(() => void) | undefined>;
    workItems: WorkItem[] | undefined;
    onWorkItemCreate: (taskId: string) => void;
}

function AddWorkItemDialog(props: Props) {
    const {
        dialogOpenTriggerRef,
        workItems,
        onWorkItemCreate,
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
            handleModalClose();
        },
        [onWorkItemCreate, handleModalClose],
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
            onClose={handleModalClose}
            heading="Add new entry"
            contentClassName={styles.modalContent}
            className={styles.addWorkItemDialog}
            focusElementRef={titleInputRef}
        >
            <div>
                Please select a task to add new entry
            </div>
            <TextInput
                inputElementRef={titleInputRef}
                label="Search by project, contact, client or task name"
                name={undefined}
                value={searchText}
                variant="general"
                onChange={setSearchText}
                icons={(
                    <RiSearchLine />
                )}
            />
            <div
                role="list"
                className={styles.taskList}
            >
                {filteredTaskList.map((task) => {
                    const { contract } = task;
                    const { project } = contract;
                    const count = taskCountMapping?.[task.id] ?? 0;

                    return (
                        <RawButton
                            className={styles.task}
                            role="listitem"
                            name={task.id}
                            onClick={handleWorkItemCreate}
                            key={task.id}
                            title="Add entry from dialog"
                        >
                            <DisplayPicture
                                className={styles.displayPicture}
                                imageUrl={project.logo?.url}
                                displayName={project.name}
                            />
                            <div className={styles.details}>
                                <div className={styles.meta}>
                                    <div>
                                        {project.name}
                                    </div>
                                    <div>
                                        ›
                                    </div>
                                    <div>
                                        {contract.name}
                                    </div>
                                </div>
                                {task.name}
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
