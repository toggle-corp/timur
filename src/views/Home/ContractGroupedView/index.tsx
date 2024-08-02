import { useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';

import List from '#components/List';
import {
    Contract,
    WorkItem,
} from '#utils/types';

import WorkItemRow, { Props as WorkItemRowProps } from '../WorkItemRow';

import styles from './styles.module.css';

export interface Props {
    className?: string;
    groupedWorkItem: {
        contract: Contract;
        workItems: WorkItem[];
    };
    setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
}

function ContractGroupedView(props: Props) {
    const {
        className,
        groupedWorkItem,
        setWorkItems,
    } = props;

    const rendererParams = useCallback((_: number, item: WorkItem) => ({
        workItem: item,
        setWorkItems,
        contract: groupedWorkItem.contract,
    } satisfies WorkItemRowProps), [setWorkItems, groupedWorkItem]);

    return (
        <div className={_cs(styles.contractGroupedView, className)}>
            <h3>
                {groupedWorkItem.contract.title}
            </h3>
            <List
                className={styles.workItemList}
                pending={false}
                errored={false}
                filtered={false}
                data={groupedWorkItem.workItems}
                keySelector={({ id }) => id}
                renderer={WorkItemRow}
                rendererParams={rendererParams}
                compact
                showSeparator
            />
        </div>
    );
}

export default ContractGroupedView;
