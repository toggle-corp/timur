import {
    useCallback,
    useContext,
    useMemo,
} from 'react';
import {
    _cs,
    isNotDefined,
    listToGroupList,
    mapToList,
} from '@togglecorp/fujs';

import List from '#components/List';
import EnumsContext from '#contexts/enums';
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
    loading: boolean;
    errored: boolean;
    onWorkItemClone: (clientId: string) => void;
    onWorkItemChange: (clientId: string, ...entries: EntriesAsList<WorkItem>) => void;
    onWorkItemDelete: (clientId: string) => void;
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
        loading,
        errored,
    } = props;

    const { taskById } = useContext(EnumsContext);

    const groupedWorkItems = useMemo(
        (): ProjectGroupedWorkItem[] | undefined => {
            if (isNotDefined(workItems) || isNotDefined(taskById)) {
                return undefined;
            }

            return mapToList(listToGroupList(
                mapToList(listToGroupList(
                    workItems,
                    (workItem) => taskById[workItem.task].contract.id,
                    undefined,
                    (list) => ({
                        contract: taskById[list[0].task].contract,
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
        [workItems, taskById],
    );

    type GroupedWorkItem = NonNullable<(typeof groupedWorkItems)>[number];

    const rendererParams = useCallback(
        (_: string, item: GroupedWorkItem): ProjectGroupedViewProps => ({
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
            pending={loading}
            errored={errored}
            filtered={false}
            data={groupedWorkItems}
            keySelector={getId}
            renderer={ProjectGroupedView}
            rendererParams={rendererParams}
            emptyMessage="No entries here!"
            emptyDescription={(
                <>
                    Click on
                    {' '}
                    <em>Add entry</em>
                    {' '}
                    to create a new entry.
                </>
            )}
        />
    );
}

export default DayView;
