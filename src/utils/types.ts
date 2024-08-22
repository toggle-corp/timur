import {
    EnumsQuery,
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
export type Contract = Task['contract'];
export type Project = Contract['project'];
export type Client = Contract['project']['projectClient'];

export type WorkItemType = TimeEntryTypeEnum;
export type WorkItemStatus = TimeEntryStatusEnum;

export type WorkItem = Omit<TimeEntryBulkCreateInput, 'clientId'> & { clientId: string };

export interface Note {
    id: string;
    date: string;
    content: string | undefined;
}

export type ConfigStorage = {
    defaultTaskType: WorkItemType,
    defaultTaskStatus: WorkItemStatus,
    editingMode: EditingMode,
    checkboxForStatus: boolean,
    showInputIcons: boolean,
    startSidebarShown: boolean,
    endSidebarShown: boolean,
}
