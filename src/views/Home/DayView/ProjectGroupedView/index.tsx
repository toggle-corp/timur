import { useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';

import List from '#components/List';
import {
    Contract,
    Project,
    WorkItem,
} from '#utils/types';

import ContractGroupedView, { Props as ContractGroupedViewProps } from './ContractGroupedView';

import styles from './styles.module.css';

export interface Props {
    className?: string;
    groupedWorkItem: {
        project: Project;
        contracts: {
            contract: Contract;
            workItems: WorkItem[];
        }[];
    };
    setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
}

function ProjectGroupedView(props: Props) {
    const {
        className,
        groupedWorkItem,
        setWorkItems,
    } = props;

    type ContractGroupedWorkItem = (typeof groupedWorkItem)['contracts'][number];

    const rendererParams = useCallback((_: number, item: ContractGroupedWorkItem) => ({
        groupedWorkItem: item,
        setWorkItems,
    } satisfies ContractGroupedViewProps), [setWorkItems]);

    return (
        <div className={_cs(styles.projectGroupedView, className)}>
            <h2>
                {groupedWorkItem.project.title}
            </h2>
            <hr className={styles.headingSeparator} />
            <List
                className={styles.contractGroupedList}
                pending={false}
                errored={false}
                filtered={false}
                data={groupedWorkItem.contracts}
                keySelector={({ contract }) => contract.id}
                renderer={ContractGroupedView}
                rendererParams={rendererParams}
                compact
            />
        </div>
    );
}

export default ProjectGroupedView;
