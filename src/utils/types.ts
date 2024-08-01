export type SpacingType = 'none' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type SpacingVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

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

export interface WorkItem {
    id: number;
    task: Task['id'];
    // taskDetails: Task
    description?: string,
    hours?: number;
    startTime?: number;
    type: WorkItemType;
    date: string;
}
