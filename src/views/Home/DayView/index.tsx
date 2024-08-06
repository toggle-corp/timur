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
    focusMode: boolean;
}

function DayView(props: Props) {
    const {
        className,
        workItems,
        onWorkItemClone,
        onWorkItemChange,
        onWorkItemDelete,
        focusMode,
    } = props;

    const groupedWorkItems = useMemo(
        (): ProjectGroupedWorkItem[] | undefined => {
            if (isNotDefined(workItems)) {
                return undefined;
            }

            return mapToList(listToGroupList(
                mapToList(listToGroupList(
                    workItems,
                    (workItem) => workItem.task.contract.id,
                    undefined,
                    (list) => ({
                        contract: list[0].task.contract,
                        workItems: list,
                    }),
                )),
                (contractGrouped) => contractGrouped.contract.project.id,
                undefined,
                (list) => ({
                    project: list[0].contract.project,
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
            focusMode,
        }),
        [
            onWorkItemClone,
            onWorkItemChange,
            onWorkItemDelete,
            focusMode,
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
                    <p>
                        Click on
                        {' '}
                        <em>Add entry</em>
                        {' '}
                        to create a new entry.
                    </p>
                </div>
            )}
        />
    );
}

export default DayView;
