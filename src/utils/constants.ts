import { ConfigStorage } from './types';

export const KEY_CONFIG_STORAGE = 'timur-config';
export const KEY_DATA_STORAGE = 'timur-meta';
export const KEY_DATA_STORAGE_OLD = 'timur';

export const defaultConfigValue: ConfigStorage = {
    defaultTaskType: 'DEVELOPMENT',
    defaultTaskStatus: 'DONE',
    allowMultipleEntry: false,
    editingMode: 'normal',
    focusMode: false,
    checkboxForStatus: false,
    showInputIcons: false,
};
