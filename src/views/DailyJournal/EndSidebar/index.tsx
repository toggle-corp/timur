import {
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import {
    _cs,
    listToGroupList,
    mapToList,
} from '@togglecorp/fujs';

import DisplayPicture from '#components/DisplayPicture';
import RawButton from '#components/RawButton';
import EnumsContext from '#contexts/enums';
import { fuzzySearch } from '#utils/common';
import {
    Task,
    WorkItem,
} from '#utils/types';

import styles from './styles.module.css';

interface Props {
    workItems: WorkItem[] | undefined;
    onWorkItemCreate: (taskId: string) => void;
}

function EndSidebar(props: Props) {
    const {
        workItems,
        onWorkItemCreate,
    } = props;

    const [activeProject, setActiveProject] = useState<string>();
    const [searchText] = useState<string | undefined>();
    const { enums } = useContext(EnumsContext);

    const handleProjectToggle = useCallback(
        (value: string) => {
            setActiveProject((prevValue) => (prevValue === value ? undefined : value));
        },
        [],
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
                    (task) => task.contract.project.projectClient.name,
                    // (task) => task.contract.project.client.abbvr,
                ],
            },
        ),
        [searchText, enums],
    );

    const projectGroupedTaskList = useMemo(() => mapToList(
        listToGroupList(
            filteredTaskList as Task[],
            (task) => task.contract.project.id,
            undefined,
            (list) => ({
                project: list[0].contract.project,
                workItems: list,
            }),
        ),
    ), [filteredTaskList]);

    const taskCountMapping = useMemo(
        () => listToGroupList(
            workItems,
            (item) => item.task,
            undefined,
            (items) => items.length,
        ),
        [workItems],
    );

    return (
        <div className={styles.endSidebar}>
            <h4>
                Quick Add Entry
            </h4>
            <div
                role="list"
                className={styles.groupedList}
            >
                {projectGroupedTaskList.map(({ project, workItems: projectWorkItems }) => (
                    <div
                        key={project.id}
                        className={styles.projectGrouped}
                        role="listitem"
                    >
                        <RawButton
                            className={_cs(
                                styles.header,
                                activeProject === project.id && styles.active,
                            )}
                            name={project.id}
                            onClick={handleProjectToggle}
                            title="Expand/Collapse project tasks"
                        >
                            <DisplayPicture
                                imageUrl={project.logo?.url}
                                displayName={project.name}
                            />
                            <div className={styles.projectName}>
                                {project.name}
                            </div>
                            <div className={styles.clientName}>
                                {project.projectClient.name}
                            </div>
                        </RawButton>
                        {activeProject === project.id && (
                            <div
                                role="list"
                                className={styles.taskList}
                            >
                                {projectWorkItems.map((task) => {
                                    // const { contract } = task;
                                    const count = taskCountMapping?.[task.id] ?? 0;

                                    return (
                                        <RawButton
                                            className={styles.task}
                                            role="listitem"
                                            name={task.id}
                                            onClick={onWorkItemCreate}
                                            key={task.id}
                                            title="Add entry from sidebar"
                                        >
                                            <span className={styles.taskName}>
                                                {task.name}
                                            </span>
                                            {/*
                                            <span className={styles.contractName}>
                                                {contract.name}
                                            </span>
                                            */}
                                            {count > 0 && (
                                                <span className={styles.usageCount}>
                                                    {count}
                                                </span>
                                            )}
                                        </RawButton>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default EndSidebar;
