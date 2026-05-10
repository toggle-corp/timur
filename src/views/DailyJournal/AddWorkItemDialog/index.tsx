import {
    KeyboardEvent,
    useCallback,
    useContext,
    useImperativeHandle,
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
    dialogOpenTriggerRef: React.RefObject<((description?: string) => void) | undefined>;
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

    const { enums } = useContext(EnumsContext);

    // TODO: We can also add search by client and client abvr
    const projectNames = useMemo(() => {
        const projects:[string, string][] = (enums?.private.allActiveTasks ?? [])
            .flatMap((task) => {
                const { project } = task.contract;
                const trimmedName = project.name.trim();

                const response: [string, string][] = [
                    [trimmedName.toLowerCase(), trimmedName],
                ];
                const trimmedShort = project.shortName?.trim();
                if (trimmedShort) {
                    response.push([trimmedShort.toLowerCase(), trimmedName]);
                }
                return response;
            });
        return projects;
    }, [enums]);

    useImperativeHandle(dialogOpenTriggerRef, () => (description?: string) => {
        let defaultSearchText: string | undefined = '';
        if (description) {
            const lowerDesc = description.toLowerCase().trim();

            const matchedProject = projectNames.find(
                ([lowerName]) => lowerDesc.includes(lowerName),
            );
            if (matchedProject) {
                defaultSearchText = `${matchedProject[1]} `;
            }
        }
        setSearchText(defaultSearchText);
        setShowAddWorkItemDialog(true);
    }, [projectNames]);

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

    const filteredTaskList = useMemo(
        () => fuzzySearch(
            enums?.private.allActiveTasks ?? [],
            searchText ?? '',
            {
                keys: [
                    (task) => task.name,
                    (task) => task.contract.name,
                    (task) => task.contract.project.name,
                    (task) => task.contract.project.shortName ?? '',
                    (task) => task.contract.project.projectClient.name,
                ],
            },
        ),
        [searchText, enums],
    );

    const handleAcceptFirstOption = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key !== 'Enter') {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            const firstItem = filteredTaskList[0];
            if (!firstItem) {
                return;
            }
            handleWorkItemCreate(firstItem.id);
        },
        [filteredTaskList, handleWorkItemCreate],
    );

    return (
        <Dialog
            open={showAddWorkItemDialog}
            onClose={handleModalClose}
            heading="Add entry"
            contentClassName={styles.modalContent}
            className={styles.addWorkItemDialog}
            focusElementRef={titleInputRef}
            closeOnOutsideClick
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
                onKeyDown={handleAcceptFirstOption}
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
