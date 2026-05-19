import {
    useCallback,
    useContext,
    useMemo,
} from 'react';
import {
    RiArrowLeftLine,
    RiDraggable,
} from 'react-icons/ri';
import {
    useLocation,
    useNavigate,
} from 'react-router-dom';
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

import Button from '#components/Button';
import Checkbox from '#components/Checkbox';
import Link from '#components/Link';
import Page from '#components/Page';
import RadioInput from '#components/RadioInput';
import SelectInput from '#components/SelectInput';
import EnumsContext from '#contexts/enums';
import { EnumsQuery } from '#generated/types/graphql';
import useGoogleCalendar from '#hooks/useGoogleCalendar';
import useLocalStorage from '#hooks/useLocalStorage';
import useSetFieldValue from '#hooks/useSetFieldValue';
import {
    colorscheme,
    defaultConfigValue,
    numericOptionKeySelector,
    numericOptionLabelSelector,
    paletteOptions,
    themeModeOptions,
} from '#utils/constants';
import {
    DailyJournalAttribute,
    DailyJournalAttributeKeys,
    DailyJournalGrouping,
    EditingMode,
    NumericOption,
    ProjectSortOrder,
    Task,
    ThemeMode,
    WorkItem,
    WorkItemAction,
} from '#utils/types';

import DayView from '../DailyJournal/DayView';

import styles from './styles.module.css';

// FIXME: This should be re-used
const workItemActionLabels: { key: WorkItemAction; label: string }[] = [
    { key: 'clone', label: 'Clone' },
    { key: 'clone-with-description', label: 'Clone with description' },
    { key: 'copy', label: 'Copy to another day' },
    { key: 'move', label: 'Move to another day' },
    { key: 'delete', label: 'Delete' },
];

const dailyJournalAttributeDetails: Record<DailyJournalAttributeKeys, { label: string }> = {
    project: { label: 'Project' },
    contract: { label: 'Contract' },
    task: { label: 'Task' },
    status: { label: 'Status' },
};

function getAttributeLabel(attribute: DailyJournalAttribute) {
    return dailyJournalAttributeDetails[attribute.key].label;
}

// FIXME: move this below
function buildGroupLevelOptions(attributes: DailyJournalAttribute[]): NumericOption[] {
    return attributes.map((_, index) => ({
        key: index + 1,
        label: attributes
            .slice(0, index + 1)
            .map(getAttributeLabel)
            .join(' + '),
    }));
}

// FIXME: move this below
function buildJoinLevelOptions(
    attributes: DailyJournalAttribute[],
    groupLevel: number,
): NumericOption[] {
    return Array.from({ length: groupLevel }, (_, index) => {
        const joinLevel = index + 1;
        const start = groupLevel - joinLevel;
        return {
            key: joinLevel,
            label: attributes
                .slice(start, groupLevel)
                .map(getAttributeLabel)
                .join(' › '),
        };
    }).reverse();
}

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

type PaletteVariant = 'light' | 'dark';

function paletteKeySelector(option: typeof paletteOptions[number]) {
    return option.key;
}

interface PaletteLabelProps {
    option: typeof paletteOptions[number];
    variant: PaletteVariant;
}

function PaletteLabel({ option, variant }: PaletteLabelProps) {
    const swatches = option.swatches[variant];
    return (
        <span className={styles.paletteLabel}>
            <span className={styles.swatches}>
                <span className={styles.swatch} style={{ backgroundColor: swatches.background }} />
                <span className={styles.swatch} style={{ backgroundColor: swatches.primary }} />
                <span className={styles.swatch} style={{ backgroundColor: swatches.secondary }} />
            </span>
            <span>
                {option.label}
            </span>
        </span>
    );
}

function lightPaletteLabelSelector(option: typeof paletteOptions[number]) {
    return <PaletteLabel option={option} variant="light" />;
}

function darkPaletteLabelSelector(option: typeof paletteOptions[number]) {
    return <PaletteLabel option={option} variant="dark" />;
}

function themeModeKeySelector(item: { key: ThemeMode }) {
    return item.key;
}
function themeModeLabelSelector(item: { label: string }) {
    return item.label;
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

type ProjectSortOrderOption = { key: ProjectSortOrder, label: string };
function projectSortOrderKeySelector(item: ProjectSortOrderOption) {
    return item.key;
}
function projectSortOrderLabelSelector(item: ProjectSortOrderOption) {
    return item.label;
}
const projectSortOrderOptions: ProjectSortOrderOption[] = [
    { key: 'name', label: 'Name' },
    { key: 'standup-order', label: 'Standup Order' },
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
        return colorscheme[0];
    }
    if (item.key === 'DONE') {
        return colorscheme[4];
    }
    return colorscheme[6];
}

function defaultColorSelector<T>(_: T, i: number): readonly [string, string] {
    // NOTE: This is safe as we the index is bounded
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return colorscheme[i % colorscheme.length]!;
}

const SAMPLE_DATE = '2024-09-06';

const timurContract = {
    id: 'contract-timur-2026',
    name: '2026 Maintenance',
    project: {
        id: 'project-timur',
        name: 'Timur',
        shortName: 'Timur',
        slideOrder: 1,
        logo: null,
        projectClient: { id: 'client-internal', name: 'Internal' },
    },
} as const;

const chronoContract = {
    id: 'contract-chrono-sunset',
    name: 'Sunset & Migration',
    project: {
        id: 'project-chrono',
        name: 'Chrono',
        shortName: 'Timur',
        slideOrder: 2,
        logo: null,
        projectClient: { id: 'client-internal', name: 'Internal' },
    },
} as const;

const sampleTasks: Task[] = [
    {
        id: 'task-journal',
        name: 'Redesign',
        contract: timurContract,
    },
    {
        id: 'task-reporting',
        name: 'Dashboard',
        contract: timurContract,
    },
    {
        id: 'task-chrono-export',
        name: 'Data Export',
        contract: chronoContract,
    },
    {
        id: 'task-chrono-bugs',
        name: 'Bug fixes',
        contract: chronoContract,
    },
];

const sampleWorkItems: WorkItem[] = [
    {
        clientId: 'sample-1',
        date: SAMPLE_DATE,
        description: 'Refine work-item row layout',
        duration: 75,
        id: undefined,
        startTime: undefined,
        status: 'DONE',
        task: 'task-journal',
        type: 'DEVELOPMENT',
    },
    {
        clientId: 'sample-2',
        date: SAMPLE_DATE,
        description: 'Iterate on grouping behaviour based on review feedback',
        duration: 30,
        id: undefined,
        startTime: undefined,
        status: 'DOING',
        task: 'task-journal',
        type: 'DEVELOPMENT',
    },
    {
        clientId: 'sample-3',
        date: SAMPLE_DATE,
        description: 'Sketch reporting dashboard',
        duration: 45,
        id: undefined,
        startTime: undefined,
        status: 'TODO',
        task: 'task-reporting',
        type: 'DESIGN',
    },
    {
        clientId: 'sample-4',
        date: SAMPLE_DATE,
        description: 'Wire up weekly aggregation query and verify totals against legacy Chrono dashboard',
        duration: 90,
        id: undefined,
        startTime: undefined,
        status: 'DONE',
        task: 'task-reporting',
        type: 'DEVELOPMENT',
    },
    {
        clientId: 'sample-5',
        date: SAMPLE_DATE,
        description: 'CSV export for legacy entries',
        duration: 60,
        id: undefined,
        startTime: undefined,
        status: 'DOING',
        task: 'task-chrono-export',
        type: 'DEVELOPMENT',
    },
    {
        clientId: 'sample-6',
        date: SAMPLE_DATE,
        description: 'Investigate timezone drift on imported entries after DST change',
        duration: 40,
        id: undefined,
        startTime: undefined,
        status: 'TODO',
        task: 'task-chrono-bugs',
        type: 'RESEARCH',
    },
    {
        clientId: 'sample-7',
        date: SAMPLE_DATE,
        description: 'Daily standup',
        duration: 15,
        id: undefined,
        startTime: undefined,
        status: 'DONE',
        task: 'task-journal',
        type: 'INTERNAL_MEETING',
    },
];

function noop() {
    // intentionally empty: preview is read-only
}

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const { enums } = useContext(EnumsContext);
    const [storedConfig, setStoredConfig] = useLocalStorage('timur-config');
    const setConfigFieldValue = useSetFieldValue(setStoredConfig);

    const location = useLocation();
    const navigate = useNavigate();

    const handleBackClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
        if (location.key !== 'default') {
            event.preventDefault();
            navigate(-1);
        }
    }, [location.key, navigate]);

    const {
        isAvailable: isGoogleCalendarAvailable,
        isConnected: isGoogleCalendarConnected,
        expiresAt: googleCalendarExpiresAt,
        connect: connectGoogleCalendar,
        disconnect: disconnectGoogleCalendar,
    } = useGoogleCalendar();

    const googleCalendarStatusMessage = useMemo(() => {
        if (!isGoogleCalendarConnected) {
            return 'Connect to view events from Google Calendar. ✨';
        }
        if (!googleCalendarExpiresAt) {
            return 'Connected to Google Calendar.';
        }
        const expiresOn = new Date(googleCalendarExpiresAt).toLocaleString([], {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
        return `Connected. Integration expires on ${expiresOn}.`;
    }, [isGoogleCalendarConnected, googleCalendarExpiresAt]);

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

    const groupLevelOptions = useMemo(
        () => buildGroupLevelOptions(storedConfig.dailyJournalAttributeOrder),
        [storedConfig.dailyJournalAttributeOrder],
    );

    const joinLevelOptions = useMemo(
        () => buildJoinLevelOptions(
            storedConfig.dailyJournalAttributeOrder,
            storedConfig.dailyJournalGrouping.groupLevel,
        ),
        [
            storedConfig.dailyJournalAttributeOrder,
            storedConfig.dailyJournalGrouping.groupLevel,
        ],
    );

    const sensors = useSensors(
        useSensor(PointerSensor),
    );

    const handleQuickActionsChange = useCallback((value: boolean, name: WorkItemAction) => {
        const oldValues = storedConfig.quickActions
            ?? defaultConfigValue.quickActions;
        const next = value
            ? [...oldValues.filter((key) => key !== name), name]
            : oldValues.filter((key) => key !== name);
        setConfigFieldValue(next, 'quickActions');
    }, [storedConfig.quickActions, setConfigFieldValue]);

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
            <Link
                to="dailyJournal"
                variant="tertiary"
                icons={<RiArrowLeftLine />}
                onClick={handleBackClick}
            >
                Back to Journal
            </Link>
            <div className={styles.layout}>
                <div className={styles.settingsColumn}>
                    <div className={styles.section}>
                        <h4>
                            Appearance
                        </h4>
                        <RadioInput
                            label="Choose how light and dark modes are selected, then pick a color palette for each. ✨"
                            name="themeMode"
                            options={themeModeOptions}
                            keySelector={themeModeKeySelector}
                            labelSelector={themeModeLabelSelector}
                            onChange={setConfigFieldValue}
                            value={storedConfig.themeMode}
                        />
                        <div className={styles.paletteGroups}>
                            <RadioInput
                                name="lightPalette"
                                label="Light theme"
                                options={paletteOptions}
                                keySelector={paletteKeySelector}
                                labelSelector={lightPaletteLabelSelector}
                                value={storedConfig.lightPalette}
                                onChange={setConfigFieldValue}
                                listContainerClassName={styles.paletteRadioList}
                            />
                            <RadioInput
                                label="Dark theme"
                                name="darkPalette"
                                options={paletteOptions}
                                keySelector={paletteKeySelector}
                                labelSelector={darkPaletteLabelSelector}
                                value={storedConfig.darkPalette}
                                onChange={setConfigFieldValue}
                                listContainerClassName={styles.paletteRadioList}
                            />
                        </div>
                    </div>
                    <div className={styles.section}>
                        <h4>
                            Entry
                        </h4>
                        <Checkbox
                            name="compactTextArea"
                            label="Expand text area only on focus"
                            value={storedConfig.compactTextArea}
                            onChange={setConfigFieldValue}
                        />
                        <Checkbox
                            name="checkboxForStatus"
                            label="Make status compact"
                            tooltip="Use checkbox instead of select input for the status. i.e. to toggle TODO, DOING and DONE"
                            value={storedConfig.checkboxForStatus}
                            onChange={setConfigFieldValue}
                        />
                        <Checkbox
                            name="enableStrikethrough"
                            label="Strikethrough completed entries"
                            value={storedConfig.enableStrikethrough}
                            onChange={setConfigFieldValue}
                        />
                        {/* FIXME: Create CheckboxInput */}
                        <div className={styles.description}>
                            Choose which actions are visible outside the popup. ✨
                        </div>
                        {workItemActionLabels.map(({ key, label }) => (
                            <Checkbox
                                key={key}
                                name={key}
                                label={label}
                                value={storedConfig.quickActions?.includes(key)}
                                onChange={handleQuickActionsChange}
                            />
                        ))}
                    </div>
                    <div className={styles.section}>
                        <h4>
                            Ordering and Grouping
                        </h4>
                        <Checkbox
                            name="indent"
                            label="Indent groups"
                            value={storedConfig.indent}
                            onChange={setConfigFieldValue}
                        />
                        <Checkbox
                            name="enableCollapsibleGroups"
                            label="Collapsible groups"
                            value={storedConfig.enableCollapsibleGroups}
                            onChange={setConfigFieldValue}
                        />
                        <div className={styles.description}>
                            Drag and drop to order entries by these attributes.
                        </div>
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
                        <div className={styles.description}>
                            Choose which attributes are used for grouping ✨
                        </div>
                        <SelectInput
                            name="groupLevel"
                            value={storedConfig.dailyJournalGrouping.groupLevel}
                            onChange={updateJournalGrouping}
                            options={groupLevelOptions}
                            keySelector={numericOptionKeySelector}
                            labelSelector={numericOptionLabelSelector}
                            nonClearable
                        />
                        <div className={styles.description}>
                            Choose which groups are combined into a single heading ✨
                        </div>
                        <SelectInput
                            name="joinLevel"
                            value={storedConfig.dailyJournalGrouping.joinLevel}
                            onChange={updateJournalGrouping}
                            options={joinLevelOptions}
                            keySelector={numericOptionKeySelector}
                            labelSelector={numericOptionLabelSelector}
                            nonClearable
                        />
                        <RadioInput
                            label="Choose how projects are sorted ✨"
                            name="projectSortOrder"
                            value={storedConfig.projectSortOrder}
                            onChange={setConfigFieldValue}
                            options={projectSortOrderOptions}
                            keySelector={projectSortOrderKeySelector}
                            labelSelector={projectSortOrderLabelSelector}
                        />
                    </div>
                    <div className={styles.section}>
                        <h4>
                            Create Entry
                        </h4>
                        <div className={styles.description}>
                            Choose default status when a new entry is created
                        </div>
                        <SelectInput
                            name="defaultTaskStatus"
                            options={enums?.enums.TimeEntryStatus}
                            keySelector={workItemStatusKeySelector}
                            labelSelector={workItemStatusLabelSelector}
                            colorSelector={workItemStatusColorSelector}
                            onChange={setConfigFieldValue}
                            value={storedConfig.defaultTaskStatus}
                            nonClearable
                        />
                        <div className={styles.description}>
                            Choose default task when a new entry is created
                        </div>
                        <SelectInput
                            name="defaultTaskType"
                            options={enums?.enums.TimeEntryType}
                            keySelector={workItemTypeKeySelector}
                            labelSelector={workItemTypeLabelSelector}
                            colorSelector={defaultColorSelector}
                            onChange={setConfigFieldValue}
                            value={storedConfig.defaultTaskType}
                            placeholder="Empty"
                        />
                    </div>
                    <div className={styles.section}>
                        <h4>
                            Create Notes
                        </h4>
                        <div className={styles.description}>
                            Choose the editing mode for the editor
                        </div>
                        <RadioInput
                            name="editingMode"
                            options={editingOptions}
                            keySelector={editingOptionKeySelector}
                            labelSelector={editingOptionLabelSelector}
                            // colorSelector={defaultColorSelector}
                            onChange={setConfigFieldValue}
                            value={storedConfig.editingMode}
                        />
                    </div>
                    <div className={styles.section}>
                        <h4>
                            Google Calendar
                        </h4>
                        {!isGoogleCalendarAvailable && (
                            <p>
                                Google Calendar integration requires
                                {' '}
                                <code>APP_GOOGLE_OAUTH_CLIENT_ID</code>
                                {' '}
                                to be configured.
                            </p>
                        )}
                        {isGoogleCalendarAvailable && (
                            <>
                                <p>
                                    {googleCalendarStatusMessage}
                                </p>
                                <Button
                                    name={undefined}
                                    title={isGoogleCalendarConnected
                                        ? 'Disconnect Google Calendar'
                                        : 'Connect Google Calendar'}
                                    onClick={isGoogleCalendarConnected
                                        ? disconnectGoogleCalendar
                                        : connectGoogleCalendar}
                                    variant="tertiary"
                                >
                                    {isGoogleCalendarConnected ? 'Disconnect' : 'Connect'}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                <div className={styles.previewColumn}>
                    <div className={styles.section}>
                        <h4>
                            Preview
                        </h4>
                        <div className={styles.previewFrame}>
                            <DayView
                                workItems={sampleWorkItems}
                                tasks={sampleTasks}
                                loading={false}
                                errored={false}
                                selectedDate={SAMPLE_DATE}
                                onWorkItemClone={noop}
                                onWorkItemAssist={noop}
                                onWorkItemChange={noop}
                                onWorkItemDelete={noop}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Page>
    );
}

Component.displayName = 'Settings';
