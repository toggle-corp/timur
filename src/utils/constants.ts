import {
    ConfigStorage,
    NumericOption,
    Palette,
    ThemeMode,
} from './types';

export const defaultConfigValue: ConfigStorage = {
    defaultTaskType: undefined,
    defaultTaskStatus: 'DONE',
    themeMode: 'auto',
    lightPalette: 'terracotta',
    darkPalette: 'terracotta',
    editingMode: 'normal',
    indent: true,
    compactTextArea: false,
    checkboxForStatus: false,
    enableCollapsibleGroups: false,
    enableStrikethrough: false,
    autoInferTypeOnBlur: true,
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
    projectSortOrder: 'name',
    collapsedGroups: [],
    quickActions: ['clone'],
};

interface ThemeModeOption {
    key: ThemeMode;
    label: string;
}

export const themeModeOptions: ThemeModeOption[] = [
    { key: 'auto', label: 'Auto' },
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
];

interface PaletteOption {
    key: Palette;
    label: string;
    swatches: {
        light: { background: string; primary: string; secondary: string };
        dark: { background: string; primary: string; secondary: string };
    };
}

export const paletteOptions: PaletteOption[] = [
    {
        key: 'terracotta',
        label: 'Terracotta',
        swatches: {
            light: { background: '#fafaf0', primary: '#c45332', secondary: '#6e8b3e' },
            dark: { background: '#1c1b17', primary: '#db7657', secondary: '#aebd55' },
        },
    },
    {
        key: 'catppuccin',
        label: 'Catppuccin',
        swatches: {
            light: { background: '#eff1f5', primary: '#8839ef', secondary: '#1e66f5' },
            dark: { background: '#1e1e2e', primary: '#cba6f7', secondary: '#89b4fa' },
        },
    },
    {
        key: 'gruvbox',
        label: 'Gruvbox',
        swatches: {
            light: { background: '#fbf1c7', primary: '#d65d0e', secondary: '#b57614' },
            dark: { background: '#282828', primary: '#fe8019', secondary: '#fabd2f' },
        },
    },
    {
        key: 'monokai',
        label: 'Monokai',
        swatches: {
            light: { background: '#f5f5f5', primary: '#ce4770', secondary: '#d75f00' },
            dark: { background: '#272822', primary: '#f92672', secondary: '#fd971f' },
        },
    },
    {
        key: 'solarized',
        label: 'Solarized',
        swatches: {
            light: { background: '#fdf6e3', primary: '#268bd2', secondary: '#2aa198' },
            dark: { background: '#002b36', primary: '#268bd2', secondary: '#2aa198' },
        },
    },
];

export const colorscheme = [
    // indigo 0
    ['var(--cs-0-fg)', 'var(--cs-0-bg)'],
    // lagoon 1
    ['var(--cs-1-fg)', 'var(--cs-1-bg)'],
    // jade 2
    ['var(--cs-2-fg)', 'var(--cs-2-bg)'],
    // flamingo 3
    ['var(--cs-3-fg)', 'var(--cs-3-bg)'],
    // grass 4
    ['var(--cs-4-fg)', 'var(--cs-4-bg)'],
    // aubergine 5
    ['var(--cs-5-fg)', 'var(--cs-5-bg)'],
    // honeycomb 6
    ['var(--cs-6-fg)', 'var(--cs-6-bg)'],
    // horchata 7
    ['var(--cs-7-fg)', 'var(--cs-7-bg)'],
] as const satisfies readonly (readonly [string, string])[];

export function numericOptionKeySelector(option: NumericOption) {
    return option.key;
}
export function numericOptionLabelSelector(option: NumericOption) {
    return option.label;
}
