import {
    useCallback,
    useMemo,
} from 'react';
import { FcClock } from 'react-icons/fc';
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
    return item.clientId;
}

export interface Props {
    className?: string;
    contract: Contract;
    project: Project;
    workItems: WorkItem[];
    onWorkItemClone: (clientId: string) => void;
    onWorkItemChange: (clientId: string, ...entries: EntriesAsList<WorkItem>) => void;
    onWorkItemDelete: (clientId: string) => void;
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
        (_: string, item: WorkItem): WorkItemRowProps => ({
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
                <div className={styles.textSection}>
                    <h3>
                        {project.name}
                    </h3>
                    <div className={styles.contractName}>
                        {contract.name}
                    </div>
                </div>
                {!focusMode && (
                    <div className={styles.duration}>
                        <FcClock />
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
