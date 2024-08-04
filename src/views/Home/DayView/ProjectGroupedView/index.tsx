import { useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';

import List from '#components/List';
import {
    Contract,
    EntriesAsList,
    Project,
    WorkItem,
} from '#utils/types';

import ContractGroupedView, { Props as ContractGroupedViewProps } from './ContractGroupedView';

import styles from './styles.module.css';

type ContractGroupedWorkItem = {
    contract: Contract;
    workItems: WorkItem[];
};

function getId(item: ContractGroupedWorkItem) {
    return item.contract.id;
}

export interface Props {
    className?: string;
    project: Project;
    contracts: ContractGroupedWorkItem[];
    onWorkItemClone: (id: number) => void;
    onWorkItemChange: (id: number, ...entries: EntriesAsList<WorkItem>) => void;
    onWorkItemDelete: (id: number) => void;
}

function ProjectGroupedView(props: Props) {
    const {
        className,
        project,
        contracts,
        onWorkItemClone,
        onWorkItemChange,
        onWorkItemDelete,
    } = props;

    const rendererParams = useCallback(
        (_: number, item: ContractGroupedWorkItem): ContractGroupedViewProps => ({
            project,
            contract: item.contract,
            workItems: item.workItems,
            onWorkItemClone,
            onWorkItemChange,
            onWorkItemDelete,
        }),
        [
            project,
            onWorkItemClone,
            onWorkItemChange,
            onWorkItemDelete,
        ],
    );

    return (
        <List
            className={_cs(styles.contractGroupedList, className)}
            pending={false}
            errored={false}
            filtered={false}
            data={contracts}
            keySelector={getId}
            renderer={ContractGroupedView}
            rendererParams={rendererParams}
            compact
        />
    );
}

export default ProjectGroupedView;