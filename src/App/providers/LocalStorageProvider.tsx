import {
    useCallback,
    useMemo,
    useState,
} from 'react';

import LocalStorageContext, { LocalStorageContextProps } from '#contexts/localStorage';
import { defaultConfigValue } from '#utils/constants';
import { getFromStorage } from '#utils/localStorage';
import { ConfigStorage } from '#utils/types';

interface BaseProps {
    children: React.ReactNode;
}

function LocalStorageProvider(props: BaseProps) {
    const { children } = props;
    const [storageState, setStorageState] = useState<LocalStorageContextProps['storageState']>(() => {
        const configValue = getFromStorage<ConfigStorage>('timur-config');
        return ({
            'timur-config': {
                value: configValue,
                defaultValue: defaultConfigValue,
            },
        });
    });

    const handleStorageStateUpdate: typeof setStorageState = useCallback(
        (val) => {
            setStorageState((prevValue) => {
                const newValue = typeof val === 'function'
                    ? val(prevValue)
                    : val;

                if (
                    prevValue['timur-config'].value?.dailyJournalGrouping !== newValue['timur-config'].value?.dailyJournalGrouping
                    || prevValue['timur-config'].value?.dailyJournalAttributeOrder !== newValue['timur-config'].value?.dailyJournalAttributeOrder
                ) {
                    const overriddenValue: typeof newValue = {
                        ...newValue,
                        'timur-config': {
                            ...newValue['timur-config'],
                            value: {
                                ...(newValue['timur-config'].value ?? defaultConfigValue),
                                collapsedGroups: [],
                            },
                        },
                    };
                    return overriddenValue;
                }

                return newValue;
            });
        },
        [],
    );

    const storageContextValue = useMemo<LocalStorageContextProps>(() => ({
        storageState,
        setStorageState: handleStorageStateUpdate,
    }), [storageState, handleStorageStateUpdate]);

    return (
        <LocalStorageContext.Provider value={storageContextValue}>
            {children}
        </LocalStorageContext.Provider>
    );
}

export default LocalStorageProvider;
