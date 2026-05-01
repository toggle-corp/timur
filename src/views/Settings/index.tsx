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

import Checkbox from '#components/Checkbox';
import Page from '#components/Page';
import RadioInput from '#components/RadioInput';
import SelectInput from '#components/SelectInput';
import EnumsContext from '#contexts/enums';
import { EnumsQuery } from '#generated/types/graphql';
import useLocalStorage from '#hooks/useLocalStorage';
import useSetFieldValue from '#hooks/useSetFieldValue';
import {
    colorscheme,
    defaultConfigValue,
    numericOptionKeySelector,
    numericOptionLabelSelector,
    numericOptions,
} from '#utils/constants';
import {
    DailyJournalAttribute,
    DailyJournalAttributeKeys,
    DailyJournalGrouping,
    EditingMode,
} from '#utils/types';

import WorkItemRow from '../DailyJournal/DayView/WorkItemRow';

import styles from './styles.module.css';

const dailyJournalAttributeDetails: Record<DailyJournalAttributeKeys, { label: string }> = {
    project: { label: 'Project' },
    contract: { label: 'Contract' },
    task: { label: 'Task' },
    status: { label: 'Status' },
};

interface ItemProps {
    className?: string;
    attribute: DailyJournalAttribute;
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
    attribute: DailyJournalAttribute;
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

type EditingOption = { key: EditingMode, label: string };
function editingOptionKeySelector(item: EditingOption) {
    return item.key;
}
function editingOptionLabelSelector(item: EditingOption) {
    return item.label;
}
const editingOptions: EditingOption[] = [
    { key: 'normal', label: 'Normies' },
    { key: 'vim', label: 'Vim Masterace' },
];

type WorkItemTypeOption = EnumsQuery['enums']['TimeEntryType'][number];
function workItemTypeKeySelector(item: WorkItemTypeOption) {
    return item.key;
}
function workItemTypeLabelSelector(item: WorkItemTypeOption) {
    return item.label;
}

type WorkItemStatusOption = EnumsQuery['enums']['TimeEntryStatus'][number];
function workItemStatusKeySelector(item: WorkItemStatusOption) {
    return item.key;
}
function workItemStatusLabelSelector(item: WorkItemStatusOption) {
    return item.label;
}
function workItemStatusColorSelector(item: WorkItemStatusOption): readonly [string, string] {
    if (item.key === 'DOING') {
        return colorscheme[1];
    }
    if (item.key === 'DONE') {
        return colorscheme[5];
    }
    return colorscheme[7];
}

function defaultColorSelector<T>(_: T, i: number): readonly [string, string] {
    // NOTE: This is safe as we the index is bounded
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return colorscheme[i % colorscheme.length]!;
}

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const { enums } = useContext(EnumsContext);
    const [storedConfig, setStoredConfig] = useLocalStorage('timur-config');
    const setConfigFieldValue = useSetFieldValue(setStoredConfig);

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
        // NOTE: We can assert removedItem is not undefined as sourceIndex is already checked for -1
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        newAttributes.splice(destinationIndex, 0, removedItem!);

        setConfigFieldValue(newAttributes, 'dailyJournalAttributeOrder');
    }, [setConfigFieldValue, storedConfig.dailyJournalAttributeOrder]);

    return (
        <Page
            documentTitle="Timur - Settings"
            className={styles.settings}
            contentClassName={styles.mainContent}
        >
            <div className={styles.section}>
                <h4>
                    Entry
                </h4>
                <Checkbox
                    name="compactTextArea"
                    label="Only expand text area on focus"
                    value={storedConfig.compactTextArea}
                    onChange={setConfigFieldValue}
                />
                <Checkbox
                    name="checkboxForStatus"
                    label="Use compact status indicator"
                    tooltip="Use checkbox instead of select input for the status. i.e. to toggle TODO, DOING and DONE"
                    value={storedConfig.checkboxForStatus}
                    onChange={setConfigFieldValue}
                />
                <Checkbox
                    name="enableStrikethrough"
                    label="Strikethrough completed entries 🧪"
                    value={storedConfig.enableStrikethrough}
                    onChange={setConfigFieldValue}
                />
                <div className={styles.container}>
                    <WorkItemRow
                        className={styles.workItem}
                        tasks={undefined}
                        workItem={{
                            clientId: 'xyz',
                            date: '2024-09-06',
                            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vel enim sit amet augue iaculis pharetra non ac nulla. In justo enim, egestas sed mi cursus, efficitur interdum felis.',
                            duration: 90,
                            id: undefined,
                            startTime: undefined,
                            status: 'DOING',
                            task: '1',
                            type: 'DEVELOPMENT',
                        }}
                    />
                    <WorkItemRow
                        className={styles.workItem}
                        tasks={undefined}
                        workItem={{
                            clientId: 'abc',
                            date: '2024-09-10',
                            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vel enim sit amet augue iaculis pharetra non ac nulla. In justo enim, egestas sed mi cursus, efficitur interdum felis.',
                            duration: 10,
                            id: undefined,
                            startTime: undefined,
                            status: 'DONE',
                            task: '1',
                            type: 'DESIGN',
                        }}
                    />
                </div>
            </div>
            <div className={styles.section}>
                <h4>
                    Entry ordering
                </h4>
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
                                <SortableItem
                                    key={attribute.key}
                                    attribute={attribute}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>
            </div>
            <div className={styles.section}>
                <h4>
                    Entry Grouping
                </h4>
                <Checkbox
                    name="indent"
                    label="Indent headings"
                    value={storedConfig.indent}
                    onChange={setConfigFieldValue}
                />
                <Checkbox
                    name="enableCollapsibleGroups"
                    label="Enable collapsible groups 🧪"
                    value={storedConfig.enableCollapsibleGroups}
                    onChange={setConfigFieldValue}
                />
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
                    // eslint-disable-next-line max-len
                    options={numericOptions.slice(0, storedConfig.dailyJournalGrouping.groupLevel)}
                    keySelector={numericOptionKeySelector}
                    labelSelector={numericOptionLabelSelector}
                />
            </div>
            <div className={styles.section}>
                <h4>
                    Create Entry
                </h4>
                <SelectInput
                    name="defaultTaskStatus"
                    variant="general"
                    label="Default Entry Status"
                    options={enums?.enums.TimeEntryStatus}
                    keySelector={workItemStatusKeySelector}
                    labelSelector={workItemStatusLabelSelector}
                    colorSelector={workItemStatusColorSelector}
                    onChange={setConfigFieldValue}
                    value={storedConfig.defaultTaskStatus}
                    nonClearable
                />
                <SelectInput
                    name="defaultTaskType"
                    label="Default Entry Type"
                    variant="general"
                    options={enums?.enums.TimeEntryType}
                    keySelector={workItemTypeKeySelector}
                    labelSelector={workItemTypeLabelSelector}
                    colorSelector={defaultColorSelector}
                    onChange={setConfigFieldValue}
                    value={storedConfig.defaultTaskType}
                />
            </div>
            <div className={styles.section}>
                <h4>
                    Create Notes
                </h4>
                <SelectInput
                    name="editingMode"
                    label="Editing Mode"
                    variant="general"
                    options={editingOptions}
                    keySelector={editingOptionKeySelector}
                    labelSelector={editingOptionLabelSelector}
                    // colorSelector={defaultColorSelector}
                    onChange={setConfigFieldValue}
                    value={storedConfig.editingMode}
                    nonClearable
                />
            </div>
        </Page>
    );
}

Component.displayName = 'Settings';
