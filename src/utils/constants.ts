import { ConfigStorage } from './types';

export const KEY_CONFIG_STORAGE = 'timur-config';

export const defaultConfigValue: ConfigStorage = {
    defaultTaskType: 'DEVELOPMENT',
    defaultTaskStatus: 'DONE',
    editingMode: 'normal',
    compactTextArea: false,
    checkboxForStatus: false,
    showInputIcons: false,
    startSidebarShown: window.innerWidth >= 900,
    endSidebarShown: false,
    notes: [],
};
