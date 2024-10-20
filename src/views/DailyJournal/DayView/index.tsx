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
    DailyJournalAttribute,
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

    const getWorkItemLabelFromAttr = useCallback((
        item: WorkItem,
        attr: DailyJournalAttribute,
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

    const getWorkItemIconFromAttr = useCallback((
        item: WorkItem,
        attr: DailyJournalAttribute,
    ) => {
        if (isNotDefined(taskById)) {
            return undefined;
        }

        const taskDetails = taskById[item.task];

        if (attr.key === 'project') {
            return taskDetails.contract.project.logo;
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
        dailyJournalGrouping: {
            groupLevel,
            joinLevel,
        },
        indent,
    } = storedConfig;

    const groupedItems = useMemo(() => {
        if (isNotDefined(taskById) || isNotDefined(workItems)) {
            return [];
        }

        const sortedWorkItems = sortByAttributes(
            workItems,
            dailyJournalAttributeOrder,
            (a, b, attr) => (
                compareString(
                    getWorkItemLabelFromAttr(a, attr),
                    getWorkItemLabelFromAttr(b, attr),
                    attr.sortDirection,
                )
            ),
        );

        return groupListByAttributes(
            sortedWorkItems,
            dailyJournalAttributeOrder.slice(0, groupLevel),
            (a, b, attr) => {
                const aValue = getWorkItemLabelFromAttr(a, attr);
                const bValue = getWorkItemLabelFromAttr(b, attr);

                return aValue === bValue;
            },
            (item, attrs) => {
                const values = attrs.map((attr) => getWorkItemLabelFromAttr(item, attr)).join(';');
                return values;
            },
        );
    }, [
        taskById,
        workItems,
        getWorkItemLabelFromAttr,
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
                            // Main Heading
                            // NOTE: Need to add 1 as groupLevel and level starts from 1 and 0 resp.
                            if (groupedItem.level + 1 < (groupLevel - joinLevel + 1)) {
                                const headingText = getWorkItemLabelFromAttr(
                                    groupedItem.value,
                                    groupedItem.attribute,
                                );
                                const currentIcon = getWorkItemIconFromAttr(
                                    groupedItem.value,
                                    groupedItem.attribute,
                                );

                                const headingLevel = bound(groupedItem.level + 2, 2, 4);
                                const Heading = `h${headingLevel}` as unknown as ElementType;

                                return (
                                    <Heading
                                        key={`heading-${groupedItem.attribute.key}-of-${groupedItem.groupKey}`}
                                        className={styles.nestedHeading}
                                    >
                                        {indent && <Indent level={groupedItem.level} />}
                                        {currentIcon && (
                                            <img
                                                className={styles.icon}
                                                src={currentIcon.url}
                                                alt={headingText}
                                            />
                                        )}
                                        {headingText}
                                    </Heading>
                                );
                            }

                            // Sub Headings
                            // NOTE: We only need to show one subheading after the main headings
                            // NOTE: Need to add 1 as groupLevel and level starts from 1 and 0 resp.
                            if (groupedItem.level + 1 === groupLevel) {
                                return (
                                    <h4
                                        className={styles.joinedHeading}
                                        key={`sub-heading-group-of-${groupedItem.groupKey}`}
                                    >
                                        {indent && (
                                            <Indent
                                                level={groupedItem.level - joinLevel + 1}
                                            />
                                        )}
                                        {dailyJournalAttributeOrder.map((attribute, i) => {
                                            if (i >= groupLevel) {
                                                return null;
                                            }

                                            const currentLabel = getWorkItemLabelFromAttr(
                                                groupedItem.value,
                                                attribute,
                                            );
                                            const currentIcon = getWorkItemIconFromAttr(
                                                groupedItem.value,
                                                attribute,
                                            );

                                            if (i < (groupLevel - joinLevel)) {
                                                return null;
                                            }

                                            return (
                                                <Fragment key={`subheading-${attribute.key}-of-${groupedItem.groupKey}`}>
                                                    {i > (groupLevel - joinLevel) && (
                                                        <div className={styles.separator} />
                                                    )}
                                                    {currentIcon && (
                                                        <img
                                                            className={styles.icon}
                                                            src={currentIcon.url}
                                                            alt={currentLabel}
                                                        />
                                                    )}
                                                    <div>{currentLabel}</div>
                                                </Fragment>
                                            );
                                        })}
                                    </h4>
                                );
                            }

                            return null;
                        }

                        const taskDetails = taskById?.[groupedItem.value.task];
                        if (!taskDetails) {
                            return null;
                        }

                        const itemErrored = groupedItem.value.status !== 'TODO' && (
                            isNotDefined(groupedItem.value.type)
                            || isNotDefined(groupedItem.value.duration)
                        );

                        return (
                            <div
                                className={styles.workItemContainer}
                                key={groupedItem.value.clientId}
                            >
                                {indent && (
                                    <Indent
                                        level={groupedItem.level - joinLevel + 1}
                                    />
                                )}
                                <WorkItemRow
                                    className={_cs(styles.workItem, itemErrored && styles.errored)}
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
