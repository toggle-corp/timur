import {
    ConfigStorage,
    NumericOption,
} from './types';

export const defaultConfigValue: ConfigStorage = {
    defaultTaskType: undefined,
    defaultTaskStatus: 'DONE',
    editingMode: 'normal',
    compactTextArea: false,
    checkboxForStatus: false,
    showInputIcons: false,
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
};

export const colorscheme: [string, string][] = [
    // gray 0
    ['#454447', '#eaeaea'],
    // idigo 1
    ['#2840a9', '#dce3fa'],
    // lagoon 2
    ['#0474a6', '#c1f0fe'],
    // jade 3
    ['#007a5a', '#c3f6e0'],
    // flamingo 4
    ['#c01343', '#ffd6e4'],
    // grass 5
    ['#50740e', '#e5f5b8'],
    // aubergine 6
    ['#83388a', '#f4daff'],
    // honeycomb 7
    ['#a86e00', '#fde3aa'],
    // horchata 8
    ['#7d5327', '#ecdecc'],
];

// FIXME: We should instead generate these options
export const numericOptions: NumericOption[] = [
    { key: 1, label: '1' },
    { key: 2, label: '2' },
    { key: 3, label: '3' },
    { key: 4, label: '4' },
    { key: 5, label: '5' },
    { key: 6, label: '6' },
    { key: 7, label: '7' },
    { key: 8, label: '8' },
    { key: 9, label: '9' },
];
export function numericOptionKeySelector(option: NumericOption) {
    return option.key;
}
export function numericOptionLabelSelector(option: NumericOption) {
    return option.label;
}
