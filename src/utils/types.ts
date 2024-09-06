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

export type Task = EnumsQuery['private']['allActiveTasks'][number];

type WorkItemType = TimeEntryTypeEnum;
export type WorkItemStatus = TimeEntryStatusEnum;

export type WorkItem = Omit<TimeEntryBulkCreateInput, 'clientId'> & { clientId: string };

export type DailyJournalAttributeKeys = 'project' | 'contract' | 'task' | 'status';
export interface DailyJournalAttributeOrder {
    key: DailyJournalAttributeKeys;
    sortDirection: number;
}

export interface DailyJournalGrouping {
    groupLevel: number;
    joinLevel: number;
}

export type ConfigStorage = {
    defaultTaskType: WorkItemType | undefined,
    defaultTaskStatus: WorkItemStatus,
    editingMode: EditingMode,
    checkboxForStatus: boolean,
    showInputIcons: boolean,
    startSidebarShown: boolean,
    endSidebarShown: boolean,
    compactTextArea: boolean,
    dailyJournalAttributeOrder: DailyJournalAttributeOrder[];
    dailyJournalGrouping: DailyJournalGrouping;
}

export interface GeneralEvent {
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
