import { createContext } from 'react';

import { EnumsQuery } from '#generated/types/graphql';

export interface EnumsContextProps {
    enums: EnumsQuery | undefined;
}

const EnumsContext = createContext<EnumsContextProps>({
    enums: undefined,
});

export default EnumsContext;
