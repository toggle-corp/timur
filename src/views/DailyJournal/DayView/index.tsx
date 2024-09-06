import {
    ElementType,
    Fragment,
    useCallback,
    useContext,
    useMemo,
} from 'react';
import {
    _cs,
    bound,
    compareString,
    isDefined,
    isNotDefined,
    sum,
} from '@togglecorp/fujs';

import DefaultMessage from '#components/DefaultMessage';
import Indent from '#components/Indent';
import EnumsContext from '#contexts/enums';
import useFormattedRelativeDate from '#hooks/useFormattedRelativeDate';
import useLocalStorage from '#hooks/useLocalStorage';
import {
    getDurationString,
    groupListByAttributes,
    sortByAttributes,
} from '#utils/common';
import {
    DailyJournalAttributeOrder,
    EntriesAsList,
    WorkItem,
} from '#utils/types';

import WorkItemRow from './WorkItemRow';

import styles from './styles.module.css';

const dateFormatter = new Intl.DateTimeFormat(
    [],
    {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
    },
);

interface Props {
    className?: string;
    workItems: WorkItem[] | undefined;
    loading: boolean;
    errored: boolean;
    onWorkItemClone: (clientId: string, override?: Partial<WorkItem>) => void;
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

    const [storedConfig] = useLocalStorage('timur-config');

    const getWorkItemAttribute = useCallback((
        item: WorkItem,
        attr: DailyJournalAttributeOrder,
    ) => {
        if (attr.key === 'status') {
            return item.status;
        }

        if (isNotDefined(taskById)) {
            return undefined;
        }

        const taskDetails = taskById[item.task];

        if (attr.key === 'task') {
            return taskDetails.name;
        }

        if (attr.key === 'contract') {
            return taskDetails.contract.name;
        }

        if (attr.key === 'project') {
            return taskDetails.contract.project.name;
        }

        return undefined;
    }, [taskById]);

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

    const {
        dailyJournalAttributeOrder,
        dailyJournalGrouping,
    } = storedConfig;

    const { groupLevel, joinLevel } = dailyJournalGrouping;

    const groupedItems = useMemo(() => {
        if (isNotDefined(taskById) || isNotDefined(workItems)) {
            return [];
        }

        const sortedWorkItems = sortByAttributes(
            workItems,
            dailyJournalAttributeOrder,
            (a, b, attr) => (
                compareString(
                    getWorkItemAttribute(a, attr),
                    getWorkItemAttribute(b, attr),
                    attr.sortDirection,
                )
            ),
        );

        return groupListByAttributes(
            sortedWorkItems,
            dailyJournalAttributeOrder.slice(0, groupLevel),
            (a, b, attr) => {
                const aValue = getWorkItemAttribute(a, attr);
                const bValue = getWorkItemAttribute(b, attr);

                return aValue === bValue;
            },
        );
    }, [
        taskById,
        workItems,
        getWorkItemAttribute,
        dailyJournalAttributeOrder,
        groupLevel,
    ]);

    return (
        <section className={_cs(styles.dayView, className)}>
            <header className={styles.header}>
                <h2 className={styles.heading}>
                    {formattedDate}
                    {' '}
                    <span className={styles.relativeDate}>
                        {`(${formattedRelativeDate})`}
                    </span>
                </h2>
                {isDefined(totalHours) && (
                    <div
                        className={styles.duration}
                    >
                        <div>
                            {getDurationString(totalHours)}
                        </div>
                    </div>
                )}
            </header>
            <DefaultMessage
                filtered={false}
                empty={groupedItems.length === 0}
                pending={loading}
                errored={errored}
            />
            {!errored && !loading && (
                <div className={styles.newGroup}>
                    {groupedItems.map((groupedItem) => {
                        if (groupedItem.type === 'heading') {
                            const levelDiff = groupLevel - joinLevel;

                            const headingText = getWorkItemAttribute(
                                groupedItem.value,
                                groupedItem.attribute,
                            );

                            if (groupedItem.level < levelDiff) {
                                const Heading = `h${bound(groupedItem.level + 2, 2, 4)}` as unknown as ElementType;

                                return (
                                    <Heading
                                        key={groupedItem.key}
                                        className={styles.nestedHeading}
                                    >
                                        <Indent level={groupedItem.level} />
                                        {headingText}
                                    </Heading>
                                );
                            }

                            if (groupedItem.level < (groupLevel - 1)) {
                                return null;
                            }

                            return (
                                <h4
                                    className={styles.joinedHeading}
                                    key={groupedItem.key}
                                >
                                    <Indent level={groupedItem.level - joinLevel + 1} />
                                    {dailyJournalAttributeOrder.map((attribute, i) => {
                                        if (i >= groupLevel) {
                                            return null;
                                        }

                                        const currentLabel = getWorkItemAttribute(
                                            groupedItem.value,
                                            attribute,
                                        );

                                        if (i < (groupLevel - joinLevel)) {
                                            return null;
                                        }

                                        return (
                                            <Fragment key={attribute.key}>
                                                {i > (groupLevel - joinLevel) && (
                                                    <div className={styles.separator} />
                                                )}
                                                <div>{currentLabel}</div>
                                            </Fragment>
                                        );
                                    })}
                                </h4>
                            );
                        }

                        const taskDetails = taskById?.[groupedItem.value.task];

                        if (!taskDetails) {
                            return null;
                        }

                        return (
                            <div className={styles.workItemContainer}>
                                <Indent level={groupedItem.level - joinLevel} />
                                <WorkItemRow
                                    key={groupedItem.value.clientId}
                                    className={styles.workItem}
                                    workItem={groupedItem.value}
                                    onClone={onWorkItemClone}
                                    onChange={onWorkItemChange}
                                    onDelete={onWorkItemDelete}
                                    contractId={taskDetails.contract.id}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default DayView;
