export type EntriesAsList<T> = {
    [K in keyof T]-?: [T[K], K, ...unknown[]];
}[keyof T];

export type SpacingType = 'none' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type SpacingVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type EditingMode = 'normal' | 'vim';

export interface Client {
    id: number;
    title: string;
    abbvr?: string;
    description?: string;

    // projects: Project[];
}

export interface Project {
    id: number;
    title: string;
    client: Client['id'];
    contractor: Client['id'];
    // clientDetails: Client;

    // contracts: Contract[];
}

export interface Contract {
    id: number;
    title: string;

    project: Project['id'];
    // projectDetails: Project;
    // tasks: Task[];
}

export interface Task {
    id: number;
    title: string;
    contract: Contract['id'];
    // contractDetails: Contract;
}

export type WorkItemType = 'design' | 'development' | 'qa' | 'devops' | 'documentation' | 'meeting' | 'internal-discussion';
export type WorkItemStatus = 'todo' | 'doing' | 'done';

export interface WorkItem {
    id: number;
    task: Task['id'];
    // taskDetails: Task
    description?: string,
    hours?: number;
    startTime?: number;
    status?: WorkItemStatus;
    type: WorkItemType;
    date: string;
}

export interface Note {
    id: number;
    date: string;
    content: string | undefined;
}
