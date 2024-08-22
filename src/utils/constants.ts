import { ConfigStorage } from './types';

export const KEY_CONFIG_STORAGE = 'timur-config';
export const KEY_DATA_STORAGE = 'timur-meta';
export const KEY_DATA_STORAGE_OLD = 'timur';

export const defaultConfigValue: ConfigStorage = {
    defaultTaskType: 'DEVELOPMENT',
    defaultTaskStatus: 'DONE',
    editingMode: 'normal',
    checkboxForStatus: false,
    showInputIcons: false,
    startSidebarShown: window.innerWidth >= 900,
    endSidebarShown: false,
};
