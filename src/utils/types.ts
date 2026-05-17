import {
    EnumsQuery,
    EventTypeEnum,
    TimeEntryBulkCreateInput,
    TimeEntryStatusEnum,
    TimeEntryTypeEnum,
} from '#generated/types/graphql';

export type EntriesAsList<T> = {
    [K in keyof T]-?: [T[K], K, ...unknown[]];
}[keyof T];

export type SpacingType = 'none' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type SpacingVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type EditingMode = 'normal' | 'vim';

export type WorkItemAction = 'clone' | 'clone-with-description' | 'copy' | 'move' | 'delete';

export type Task = EnumsQuery['private']['allActiveTasks'][number];

type WorkItemType = TimeEntryTypeEnum;
export type WorkItemStatus = TimeEntryStatusEnum;

export type WorkItem = Omit<TimeEntryBulkCreateInput, 'clientId'> & { clientId: string };

export type DailyJournalAttributeKeys = 'project' | 'contract' | 'task' | 'status';
export interface DailyJournalAttribute {
    key: DailyJournalAttributeKeys;
    sortDirection: number;
}

export interface DailyJournalGrouping {
    groupLevel: number;
    joinLevel: number;
}

export type ProjectSortOrder = 'name' | 'standup-order';

export type Palette = 'catppuccin' | 'gruvbox' | 'monokai' | 'solarized' | 'terracotta';

export type ThemeMode = 'auto' | 'light' | 'dark';

export type ConfigStorage = {
    defaultTaskType: WorkItemType | undefined,
    defaultTaskStatus: WorkItemStatus,

    themeMode: ThemeMode,
    lightPalette: Palette,
    darkPalette: Palette,

    editingMode: EditingMode,

    checkboxForStatus: boolean,
    compactTextArea: boolean,
    indent: boolean,
    enableCollapsibleGroups: boolean,
    enableStrikethrough: boolean,

    dailyJournalAttributeOrder: DailyJournalAttribute[];
    dailyJournalGrouping: DailyJournalGrouping;
    projectSortOrder: ProjectSortOrder;

    quickActions: WorkItemAction[];

    collapsedGroups: string[],
    startSidebarShown: boolean,
    endSidebarShown: boolean,
}

export interface GeneralEventType {
    key: string;
    type: EventTypeEnum | 'DEADLINE';
    typeDisplay: string;
    icon: React.ReactNode;
    name: string;
    remainingDays: number;
}

export interface NumericOption {
    key: number;
    label: string;
}
