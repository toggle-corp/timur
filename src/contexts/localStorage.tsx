import { createContext } from 'react';

export type StoredValue<VALUE = unknown> = {
    timestamp: number;
    value: VALUE;
};
type StorageState<VALUE = unknown> = Record<string, StoredValue<VALUE>>;

export interface LocalStorageContextProps {
    storageState: StorageState;
    setStorageState: React.Dispatch<React.SetStateAction<StorageState>>;
}

const LocalStorageContext = createContext<LocalStorageContextProps>({
    storageState: {},
    setStorageState: () => {
        // eslint-disable-next-line no-console
        console.error('LocalStorageContext::setStorage() called without a provider');
    },
});

export default LocalStorageContext;
