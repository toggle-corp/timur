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

import DisplayPicture from '#components/DisplayPicture';
import List from '#components/List';
import useLocalStorage from '#hooks/useLocalStorage';
import { getDurationString } from '#utils/common';
import {
    defaultConfigValue,
    KEY_CONFIG_STORAGE,
} from '#utils/constants';
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
    } = props;

    const [config] = useLocalStorage(KEY_CONFIG_STORAGE, defaultConfigValue);

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
        }),
        [
            onWorkItemClone,
            onWorkItemChange,
            onWorkItemDelete,
            contract,
        ],
    );

    return (
        <div className={_cs(styles.contractGroupedView, className)}>
            <div className={styles.heading}>
                <DisplayPicture
                    className={styles.displayPicture}
                    imageUrl={project.logo?.url}
                    displayName={project.name}
                />
                <div className={styles.textSection}>
                    <h3>
                        {project.name}
                    </h3>
                    <div className={styles.contractName}>
                        {contract.name}
                    </div>
                </div>
                <div
                    className={_cs(
                        styles.duration,
                        config.showInputIcons && styles.withIcon,
                    )}
                >
                    {config.showInputIcons && (
                        <FcClock />
                    )}
                    {getDurationString(totalHours)}
                </div>
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
