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
import { WorkItem } from '#utils/types';

import {
    contractById,
    projectById,
    taskById,
} from '../data';
import ProjectGroupedView, { Props as ProjectGroupedViewProps } from '../ProjectGroupedView';

import styles from './styles.module.css';

interface Props {
    className?: string;
    date: string | undefined;
    workItems: WorkItem[] | undefined;
    setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
}

function DayView(props: Props) {
    const {
        className,
        date,
        workItems,
        setWorkItems,
    } = props;

    const groupedWorkItems = useMemo(
        () => {
            if (isNotDefined(workItems)) {
                return undefined;
            }

            return mapToList(
                listToGroupList(
                    mapToList(
                        listToGroupList(
                            workItems.filter((workItem) => workItem.date === date),
                            (workItem) => contractById[taskById[workItem.task].contract].id,
                        ),
                        (list) => ({
                            contract: contractById[taskById[list[0].task].contract],
                            workItems: list,
                        }),
                    ),
                    (contractGrouped) => contractGrouped.contract.project,
                ),
                (list) => ({
                    project: projectById[list[0].contract.project],
                    contracts: list,
                }),
            );
        },
        [workItems, date],
    );

    type GroupedWorkItem = NonNullable<(typeof groupedWorkItems)>[number];

    const rendererParams = useCallback((_: number, item: GroupedWorkItem) => ({
        groupedWorkItem: item,
        setWorkItems,
    } satisfies ProjectGroupedViewProps), [setWorkItems]);

    return (
        <List
            className={_cs(styles.dayView, className)}
            pending={false}
            errored={false}
            filtered={false}
            data={groupedWorkItems}
            keySelector={({ project }) => project.id}
            renderer={ProjectGroupedView}
            rendererParams={rendererParams}
            emptyMessage="No workitems here!"
        />
    );
}

export default DayView;
