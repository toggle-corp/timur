import {
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    _cs,
    isDefined,
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
    useEffect(() => {
        const projectId = enums?.private.allActiveTasks?.[0].contract.project.id;
        if (isDefined(projectId)) {
            setActiveProject(projectId);
        }
    }, [enums?.private.allActiveTasks]);
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
                            onClick={setActiveProject}
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
                                    const { contract } = task;
                                    const count = taskCountMapping?.[task.id] ?? 0;

                                    return (
                                        <RawButton
                                            className={styles.task}
                                            role="listitem"
                                            name={task.id}
                                            onClick={onWorkItemCreate}
                                            key={task.id}
                                        >
                                            <span className={styles.taskName}>
                                                {task.name}
                                            </span>
                                            <span className={styles.contractName}>
                                                {contract.name}
                                            </span>
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
