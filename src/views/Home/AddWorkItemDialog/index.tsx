import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { IoAddSharp } from 'react-icons/io5';
import {
    encodeDate,
    isDefined,
} from '@togglecorp/fujs';

import Dialog from '#components/Dialog';
import RawButton from '#components/RawButton';
import TextInput from '#components/TextInput';
import {
    getNewId,
    rankedSearchOnList,
} from '#utils/common';
import { WorkItem } from '#utils/types';

import {
    clientById,
    contractById,
    projectById,
    taskList,
} from '../data';

import styles from './styles.module.css';

interface Props {
    selectedDate: string | undefined;
    setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
    dialogOpenTriggerRef: React.MutableRefObject<(() => void) | undefined>;
}

function AddWorkItemDialog(props: Props) {
    const {
        selectedDate,
        setWorkItems,
        dialogOpenTriggerRef,
    } = props;

    const [showAddWorkItemDialog, setShowAddWorkItemDialog] = useState(false);
    const [searchText, setSearchText] = useState<string | undefined>();
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        dialogOpenTriggerRef.current = () => {
            setShowAddWorkItemDialog(true);
        };
    }, [dialogOpenTriggerRef]);

    const handleModalClose = useCallback(() => {
        setShowAddWorkItemDialog(false);
        setSearchText(undefined);
    }, []);

    const handleTaskAddClick = useCallback((taskId: number) => {
        setWorkItems((oldWorkItems) => ([
            ...(oldWorkItems ?? []),
            {
                id: getNewId(),
                task: taskId,
                type: 'development',
                date: selectedDate ?? encodeDate(new Date()),
            } satisfies WorkItem,
        ]));
    }, [selectedDate, setWorkItems]);

    return (
        <Dialog
            open={showAddWorkItemDialog}
            onClose={handleModalClose}
            heading="Add new work item"
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
                        ].filter(isDefined).join(' - ');
                    },
                ).map((task) => {
                    const contract = contractById[task.contract];
                    const project = projectById[contract.project];
                    const client = clientById[project.client];

                    return (
                        <RawButton
                            className={styles.task}
                            role="listitem"
                            name={task.id}
                            onClick={handleTaskAddClick}
                            key={task.id}
                        >
                            <IoAddSharp className={styles.icon} />
                            <div className={styles.details}>
                                <div>
                                    {task.title}
                                </div>
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
                        </RawButton>
                    );
                })}
            </div>
        </Dialog>
    );
}

export default AddWorkItemDialog;
