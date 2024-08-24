import { useCallback } from 'react';

import { EntriesAsList } from '#utils/types';

function useSetFieldValue<T extends object>(
    setValue: React.Dispatch<React.SetStateAction<T>>,
) {
    const setFieldValue = useCallback((...entries: EntriesAsList<T>) => {
        setValue((oldState) => ({
            ...oldState,
            [entries[1]]: entries[0],
        }));
    }, [setValue]);

    return setFieldValue;
}

export default useSetFieldValue;
