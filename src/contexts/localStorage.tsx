import { createContext } from 'react';

import { PutNull } from '#utils/common';
import { defaultConfigValue } from '#utils/constants';
import { ConfigStorage } from '#utils/types';

type StoredValue<VALUE extends object> = {
    value?: PutNull<VALUE>;
    defaultValue: VALUE;
};
export type StorageState = {
    'timur-config': StoredValue<ConfigStorage>,
};

export interface LocalStorageContextProps {
    storageState: StorageState;
    setStorageState: React.Dispatch<React.SetStateAction<StorageState>>;
}

const LocalStorageContext = createContext<LocalStorageContextProps>({
    storageState: {
        'timur-config': {
            defaultValue: defaultConfigValue,
        },
    },
    setStorageState: () => {
        // eslint-disable-next-line no-console
        console.error('LocalStorageContext::setStorage() called without a provider');
    },
});

export default LocalStorageContext;
