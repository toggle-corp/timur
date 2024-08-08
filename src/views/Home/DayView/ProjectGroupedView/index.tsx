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
    onWorkItemClone: (clientId: string) => void;
    onWorkItemChange: (clientId: string, ...entries: EntriesAsList<WorkItem>) => void;
    onWorkItemDelete: (clientId: string) => void;
    focusMode: boolean;
}

function ProjectGroupedView(props: Props) {
    const {
        className,
        project,
        contracts,
        onWorkItemClone,
        onWorkItemChange,
        onWorkItemDelete,
        focusMode,
    } = props;

    const rendererParams = useCallback(
        (_: string, item: ContractGroupedWorkItem): ContractGroupedViewProps => ({
            project,
            contract: item.contract,
            workItems: item.workItems,
            onWorkItemClone,
            onWorkItemChange,
            onWorkItemDelete,
            focusMode,
        }),
        [
            project,
            onWorkItemClone,
            onWorkItemChange,
            onWorkItemDelete,
            focusMode,
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
