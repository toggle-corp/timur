import { createContext } from 'react';

import { EnumsQuery } from '#generated/types/graphql';
import { Task } from '#utils/types';

type StatusOption = EnumsQuery['enums']['TimeEntryStatus'][number];
type TypeOption = EnumsQuery['enums']['TimeEntryType'][number];

type MapType<T extends StatusOption | TypeOption> = Record<T['key'], T>;

export interface EnumsContextProps {
    enums: EnumsQuery | undefined;
    taskById: Record<Task['id'], Task> | undefined;
    statusByKey: MapType<StatusOption> | undefined;
    typeByKey: MapType<TypeOption> | undefined;
}

const EnumsContext = createContext<EnumsContextProps>({
    enums: undefined,
    taskById: undefined,
    statusByKey: undefined,
    typeByKey: undefined,
});

export default EnumsContext;
