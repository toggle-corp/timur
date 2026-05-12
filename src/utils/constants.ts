import {
    ConfigStorage,
    NumericOption,
} from './types';

export const defaultConfigValue: ConfigStorage = {
    defaultTaskType: undefined,
    defaultTaskStatus: 'DONE',
    editingMode: 'normal',
    indent: true,
    compactTextArea: false,
    checkboxForStatus: false,
    enableCollapsibleGroups: false,
    enableStrikethrough: false,
    startSidebarShown: window.innerWidth >= 900,
    endSidebarShown: false,
    dailyJournalGrouping: {
        groupLevel: 2,
        joinLevel: 2,
    },
    dailyJournalAttributeOrder: [
        { key: 'project', sortDirection: 1 },
        { key: 'contract', sortDirection: 1 },
        { key: 'task', sortDirection: 1 },
        { key: 'status', sortDirection: 1 },
    ],
    collapsedGroups: [],
    quickActions: ['clone'],
};

export const colorscheme = [
    // gray 0
    ['var(--cs-0-fg)', 'var(--cs-0-bg)'],
    // indigo 1
    ['var(--cs-1-fg)', 'var(--cs-1-bg)'],
    // lagoon 2
    ['var(--cs-2-fg)', 'var(--cs-2-bg)'],
    // jade 3
    ['var(--cs-3-fg)', 'var(--cs-3-bg)'],
    // flamingo 4
    ['var(--cs-4-fg)', 'var(--cs-4-bg)'],
    // grass 5
    ['var(--cs-5-fg)', 'var(--cs-5-bg)'],
    // aubergine 6
    ['var(--cs-6-fg)', 'var(--cs-6-bg)'],
    // honeycomb 7
    ['var(--cs-7-fg)', 'var(--cs-7-bg)'],
    // horchata 8
    ['var(--cs-8-fg)', 'var(--cs-8-bg)'],
] as const satisfies readonly (readonly [string, string])[];

export function numericOptionKeySelector(option: NumericOption) {
    return option.key;
}
export function numericOptionLabelSelector(option: NumericOption) {
    return option.label;
}
