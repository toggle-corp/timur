import {
    useCallback,
    useContext,
    useMemo,
} from 'react';
import { RiDraggable } from 'react-icons/ri';
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DraggableAttributes,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    _cs,
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import MonthlyCalendar from '#components/MonthlyCalendar';
import RadioInput from '#components/RadioInput';
import DateContext from '#contexts/date';
import useLocalStorage from '#hooks/useLocalStorage';
import useSetFieldValue from '#hooks/useSetFieldValue';
import {
    defaultConfigValue,
    numericOptionKeySelector,
    numericOptionLabelSelector,
    numericOptions,
} from '#utils/constants';
import {
    DailyJournalAttributeKeys,
    DailyJournalAttributeOrder,
    DailyJournalGrouping,
} from '#utils/types';

import styles from './styles.module.css';

const dailyJournalAttributeDetails: Record<DailyJournalAttributeKeys, { label: string }> = {
    project: { label: 'Project' },
    contract: { label: 'Contract' },
    task: { label: 'Task' },
    status: { label: 'Status' },
};

interface ItemProps {
    className?: string;
    attribute: DailyJournalAttributeOrder;
    setNodeRef?: (node: HTMLElement | null) => void;
    draggableAttributes?: DraggableAttributes;
    draggableListeners?: SyntheticListenerMap | undefined;
    transformStyle?: string | undefined;
    transitionStyle?: string | undefined;
}

function Item(props: ItemProps) {
    const {
        className,
        setNodeRef,
        attribute,
        draggableAttributes,
        draggableListeners,
        transformStyle,
        transitionStyle,
    } = props;

    return (
        <div
            className={className}
            ref={setNodeRef}
            style={{
                transition: transitionStyle,
                transform: transformStyle,
            }}
        >
            <div
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...draggableAttributes}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...draggableListeners}
                className={styles.dragHandle}
            >
                <RiDraggable />
            </div>
            <div className={styles.label}>
                {dailyJournalAttributeDetails[attribute.key].label}
            </div>
        </div>
    );
}

interface SortableItemProps {
    className?: string;
    attribute: DailyJournalAttributeOrder;
}

function SortableItem(props: SortableItemProps) {
    const {
        attribute,
        className,
    } = props;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        over,
    } = useSortable({ id: attribute.key });

    const transformStyle = useMemo(() => {
        if (isNotDefined(transform)) {
            return undefined;
        }

        const transformations = [
            // isDefined(transform.x) && `translateX(${transform.x}px)`,
            isDefined(transform.y) && `translateY(${transform.y}px)`,
            isDefined(transform.scaleX) && `scaleY(${transform.scaleX})`,
            isDefined(transform.scaleY) && `scaleY(${transform.scaleY})`,
        ];

        return transformations.filter(Boolean).join(' ');
    }, [transform]);

    return (
        <Item
            className={_cs(
                styles.attribute,
                isDragging && styles.dragging,
                className,
            )}
            setNodeRef={setNodeRef}
            attribute={attribute}
            draggableAttributes={attributes}
            draggableListeners={listeners}
            transformStyle={transformStyle}
            transitionStyle={(isDragging || over?.id === attribute.key) ? transition : undefined}
        />
    );
}

interface Props {
    selectedDate: string;
    setSelectedDate: (newDate: string) => void;
    calendarComponentRef?: React.MutableRefObject<{
        resetView: (year: number, month: number) => void;
    } | null>;
}

function StartSidebar(props: Props) {
    const {
        calendarComponentRef,
        selectedDate,
        setSelectedDate,
    } = props;

    const [storedConfig, setStoredConfig] = useLocalStorage('timur-config');

    const setConfigFieldValue = useSetFieldValue(setStoredConfig);

    const { year, month } = useContext(DateContext);

    const updateJournalGrouping = useCallback((value: number, name: 'groupLevel' | 'joinLevel') => {
        const oldValue = storedConfig.dailyJournalGrouping
            ?? defaultConfigValue.dailyJournalGrouping;

        if (name === 'groupLevel') {
            setConfigFieldValue({
                groupLevel: value,
                joinLevel: Math.min(oldValue.joinLevel, value),
            } satisfies DailyJournalGrouping, 'dailyJournalGrouping');

            return;
        }

        setConfigFieldValue({
            groupLevel: oldValue.groupLevel,
            joinLevel: Math.min(oldValue.groupLevel, value),
        } satisfies DailyJournalGrouping, 'dailyJournalGrouping');
    }, [storedConfig.dailyJournalGrouping, setConfigFieldValue]);

    const sensors = useSensors(
        useSensor(PointerSensor),
    );

    const handleDndEnd = useCallback((dragEndEvent: DragEndEvent) => {
        const {
            active,
            over,
        } = dragEndEvent;

        const oldAttributes = storedConfig.dailyJournalAttributeOrder
            ?? defaultConfigValue.dailyJournalAttributeOrder;

        if (isNotDefined(active) || isNotDefined(over)) {
            return;
        }

        const newAttributes = [...oldAttributes];
        const sourceIndex = newAttributes.findIndex(({ key }) => active.id === key);
        const destinationIndex = newAttributes.findIndex(({ key }) => over.id === key);

        if (sourceIndex === -1 || destinationIndex === -1) {
            return;
        }

        const [removedItem] = newAttributes.splice(sourceIndex, 1);
        newAttributes.splice(destinationIndex, 0, removedItem);

        setConfigFieldValue(newAttributes, 'dailyJournalAttributeOrder');
    }, [setConfigFieldValue, storedConfig.dailyJournalAttributeOrder]);

    return (
        <div
            className={styles.startSidebar}
        >
            <MonthlyCalendar
                componentRef={calendarComponentRef}
                selectedDate={selectedDate}
                initialYear={selectedDate ? new Date(selectedDate).getFullYear() : year}
                initialMonth={selectedDate ? new Date(selectedDate).getMonth() : month}
                onDateClick={setSelectedDate}
            />
            <div className={styles.attributes}>
                <h4>Ordering</h4>
                <div className={styles.attributeList}>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDndEnd}
                    >
                        <SortableContext
                            items={storedConfig.dailyJournalAttributeOrder.map(
                                ({ key }) => ({ id: key }),
                            )}
                            strategy={verticalListSortingStrategy}
                        >
                            {storedConfig.dailyJournalAttributeOrder.map((attribute) => (
                                <SortableItem attribute={attribute} />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>
            </div>
            <div className={styles.grouping}>
                <h4>
                    Grouping
                </h4>
                <RadioInput
                    name="groupLevel"
                    label="Grouping Level"
                    value={storedConfig.dailyJournalGrouping.groupLevel}
                    onChange={updateJournalGrouping}
                    options={numericOptions.slice(
                        0,
                        storedConfig.dailyJournalAttributeOrder.length,
                    )}
                    keySelector={numericOptionKeySelector}
                    labelSelector={numericOptionLabelSelector}
                />
                <RadioInput
                    name="joinLevel"
                    label="Title Join Level"
                    value={storedConfig.dailyJournalGrouping.joinLevel}
                    onChange={updateJournalGrouping}
                    options={numericOptions.slice(0, storedConfig.dailyJournalGrouping.groupLevel)}
                    keySelector={numericOptionKeySelector}
                    labelSelector={numericOptionLabelSelector}
                />
            </div>
        </div>
    );
}

export default StartSidebar;
