import {
    useCallback,
    useMemo,
} from 'react';
import {
    _cs,
    isNotDefined,
    listToGroupList,
    mapToList,
} from '@togglecorp/fujs';

import List from '#components/List';
import {
    Contract,
    EntriesAsList,
    Project,
    WorkItem,
} from '#utils/types';

import {
    contractById,
    projectById,
    taskById,
} from '../data';
import ProjectGroupedView, { Props as ProjectGroupedViewProps } from './ProjectGroupedView';

import styles from './styles.module.css';

interface ProjectGroupedWorkItem {
    project: Project,
    contracts: {
        contract: Contract,
        workItems: WorkItem[],
    }[],
}

function getId(item: ProjectGroupedWorkItem) {
    return item.project.id;
}

interface Props {
    className?: string;
    workItems: WorkItem[] | undefined;
    onWorkItemClone: (id: number) => void;
    onWorkItemChange: (id: number, ...entries: EntriesAsList<WorkItem>) => void;
    onWorkItemDelete: (id: number) => void;
}

function DayView(props: Props) {
    const {
        className,
        workItems,
        onWorkItemClone,
        onWorkItemChange,
        onWorkItemDelete,
    } = props;

    const groupedWorkItems = useMemo(
        (): ProjectGroupedWorkItem[] | undefined => {
            if (isNotDefined(workItems)) {
                return undefined;
            }

            return mapToList(listToGroupList(
                mapToList(listToGroupList(
                    workItems,
                    (workItem) => taskById[workItem.task].contract,
                    undefined,
                    (list, contractId) => ({
                        contract: contractById[Number(contractId)],
                        workItems: list,
                    }),
                )),
                (contractGrouped) => contractGrouped.contract.project,
                undefined,
                (list, projectId) => ({
                    project: projectById[Number(projectId)],
                    contracts: list,
                }),
            ));
        },
        [workItems],
    );

    type GroupedWorkItem = NonNullable<(typeof groupedWorkItems)>[number];

    const rendererParams = useCallback(
        (_: number, item: GroupedWorkItem): ProjectGroupedViewProps => ({
            contracts: item.contracts,
            project: item.project,
            onWorkItemClone,
            onWorkItemChange,
            onWorkItemDelete,
        }),
        [
            onWorkItemClone,
            onWorkItemChange,
            onWorkItemDelete,
        ],
    );

    return (
        <List
            className={_cs(styles.dayView, className)}
            pending={false}
            errored={false}
            filtered={false}
            data={groupedWorkItems}
            keySelector={getId}
            renderer={ProjectGroupedView}
            rendererParams={rendererParams}
            emptyMessage={(
                <div className={styles.emptyMessage}>
                    <div className={styles.title}>
                        No entries here!
                    </div>
                    <div>
                        Click on
                        {' '}
                        <code>Add entry</code>
                        {' '}
                        button or hit
                        {' '}
                        <code>Ctrl+Space</code>
                        {' '}
                        to add a new entry.
                    </div>
                </div>
            )}
        />
    );
}

export default DayView;
