import { MyTimeEntriesQuery } from "#generated/types/graphql";

export type EntriesAsList<T> = {
    [K in keyof T]-?: [T[K], K, ...unknown[]];
}[keyof T];

export type SpacingType = 'none' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type SpacingVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type EditingMode = 'normal' | 'vim';

export type Task = WorkItem['task'];
export type Contract = Task['contract'];
export type Project = Contract['project'];
export type Client = Contract['project']['client'];

export type WorkItemType = 'design' | 'development' | 'qa' | 'devops' | 'documentation' | 'meeting' | 'internal-discussion' | 'misc';
export type WorkItemStatus = 'todo' | 'doing' | 'done';

export type WorkItem = MyTimeEntriesQuery['private']['myTimeEntries'][number];

export interface Note {
    id: number;
    date: string;
    content: string | undefined;
}
