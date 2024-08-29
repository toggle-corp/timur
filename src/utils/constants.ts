import { ConfigStorage } from './types';

export const KEY_CONFIG_STORAGE = 'timur-config';

export const defaultConfigValue: ConfigStorage = {
    defaultTaskType: undefined,
    defaultTaskStatus: 'DONE',
    editingMode: 'normal',
    compactTextArea: false,
    checkboxForStatus: false,
    showInputIcons: false,
    startSidebarShown: window.innerWidth >= 900,
    endSidebarShown: false,
    notes: [],
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
