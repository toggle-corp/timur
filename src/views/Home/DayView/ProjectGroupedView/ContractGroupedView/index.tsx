import {
    useCallback,
    useMemo,
} from 'react';
import {
    _cs,
    isDefined,
    sum,
} from '@togglecorp/fujs';

import List from '#components/List';
import { getDurationString } from '#utils/common';
import {
    Contract,
    EntriesAsList,
    Project,
    WorkItem,
} from '#utils/types';

import WorkItemRow, { Props as WorkItemRowProps } from './WorkItemRow';

import styles from './styles.module.css';

function keySelector(item: WorkItem) {
    return item.id;
}

export interface Props {
    className?: string;
    contract: Contract;
    project: Project;
    workItems: WorkItem[];
    onWorkItemClone: (id: number) => void;
    onWorkItemChange: (id: number, ...entries: EntriesAsList<WorkItem>) => void;
    onWorkItemDelete: (id: number) => void;
    focusMode: boolean;
}

function ContractGroupedView(props: Props) {
    const {
        className,
        contract,
        project,
        workItems,
        onWorkItemClone,
        onWorkItemChange,
        onWorkItemDelete,
        focusMode,
    } = props;

    const totalHours = useMemo(
        () => (
            sum(workItems.map((item) => item.duration).filter(isDefined))
        ),
        [workItems],
    );

    const rendererParams = useCallback(
        (_: number, item: WorkItem): WorkItemRowProps => ({
            workItem: item,
            onClone: onWorkItemClone,
            onChange: onWorkItemChange,
            onDelete: onWorkItemDelete,
            contract,
            focusMode,
        }),
        [
            onWorkItemClone,
            onWorkItemChange,
            onWorkItemDelete,
            contract,
            focusMode,
        ],
    );

    return (
        <div className={_cs(styles.contractGroupedView, className)}>
            <div className={styles.heading}>
                <h3>
                    {project.name}
                    {' › '}
                    {contract.name}
                </h3>
                {!focusMode && (
                    <div className={styles.duration}>
                        ⏱️
                        {' '}
                        {getDurationString(totalHours)}
                    </div>
                )}
            </div>
            <List
                className={styles.workItemList}
                pending={false}
                errored={false}
                filtered={false}
                data={workItems}
                keySelector={keySelector}
                renderer={WorkItemRow}
                rendererParams={rendererParams}
                compact
                showSeparator
            />
        </div>
    );
}

export default ContractGroupedView;
