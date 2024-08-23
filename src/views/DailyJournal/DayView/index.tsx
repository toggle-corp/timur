import {
    useCallback,
    useContext,
    useMemo,
} from 'react';
import { FcClock } from 'react-icons/fc';
import {
    _cs,
    isDefined,
    isNotDefined,
    listToGroupList,
    mapToList,
    sum,
} from '@togglecorp/fujs';

import List from '#components/List';
import EnumsContext from '#contexts/enums';
import useFormattedRelativeDate from '#hooks/useFormattedRelativeDate';
import useLocalStorage from '#hooks/useLocalStorage';
import { getDurationString } from '#utils/common';
import {
    defaultConfigValue,
    KEY_CONFIG_STORAGE,
} from '#utils/constants';
import {
    ConfigStorage,
    Contract,
    EntriesAsList,
    Project,
    WorkItem,
} from '#utils/types';

import ProjectGroupedView, { Props as ProjectGroupedViewProps } from './ProjectGroupedView';

import styles from './styles.module.css';

const dateFormatter = new Intl.DateTimeFormat(
    [],
    {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
    },
);

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
    selectedDate: string;
}

function DayView(props: Props) {
    const {
        className,
        workItems,
        onWorkItemClone,
        onWorkItemChange,
        onWorkItemDelete,
        loading,
        errored,
        selectedDate,
    } = props;

    const { taskById } = useContext(EnumsContext);
    const [storedConfig] = useLocalStorage<ConfigStorage>(
        KEY_CONFIG_STORAGE,
        defaultConfigValue,
    );

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
        }),
        [
            onWorkItemClone,
            onWorkItemChange,
            onWorkItemDelete,
        ],
    );

    const formattedDate = dateFormatter.format(new Date(selectedDate));

    const formattedRelativeDate = useFormattedRelativeDate(selectedDate);

    const totalHours = useMemo(
        () => {
            if (isDefined(workItems)) {
                return sum(workItems.map((item) => item.duration).filter(isDefined));
            }

            return undefined;
        },
        [workItems],
    );

    return (
        <section className={_cs(styles.dayView, className)}>
            <header className={styles.header}>
                <h2 className={styles.heading}>
                    {formattedDate}
                    <span className={styles.relativeDate}>
                        {`(${formattedRelativeDate})`}
                    </span>
                </h2>
                {isDefined(totalHours) && (
                    <div
                        className={_cs(
                            styles.duration,
                            storedConfig.showInputIcons && styles.withIcon,
                        )}
                    >
                        {storedConfig.showInputIcons && (
                            <FcClock />
                        )}
                        <div>
                            {getDurationString(totalHours)}
                        </div>
                    </div>
                )}
            </header>
            <List
                className={styles.projectList}
                compact={!!groupedWorkItems?.length}
                pending={loading}
                errored={errored}
                filtered={false}
                data={groupedWorkItems}
                keySelector={getId}
                renderer={ProjectGroupedView}
                rendererParams={rendererParams}
                emptyMessage="No entries here!"
                pendingMessage="Getting your entries..."
                pendingDescription="This should not take much time."
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
        </section>
    );
}

export default DayView;
