import { useMemo } from 'react';
import { listToMap } from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import EnumsContext, { EnumsContextProps } from '#contexts/enums';
import {
    EnumsQuery,
    EnumsQueryVariables,
} from '#generated/types/graphql';

const ENUMS_QUERY = gql`
    query Enums {
        enums {
            JournalWfhType {
                key
                label
            }
            JournalLeaveType {
                key
                label
            }
            TimeEntryStatus {
                key
                label
            }
            TimeEntryType {
                key
                label
            }
        }
        private {
            id
            allActiveTasks {
                id
                name
                contract {
                    id
                    name
                    project {
                        id
                        name
                        shortName
                        slideOrder
                        logo {
                            url
                        }
                        projectClient {
                            id
                            name
                        }
                    }
                }
            }
        }
    }
`;

interface BaseProps {
    children: React.ReactNode;
}

function EnumsProvider(props: BaseProps) {
    const { children } = props;

    const [enumsResult] = useQuery<EnumsQuery, EnumsQueryVariables>(
        {
            query: ENUMS_QUERY,
            requestPolicy: 'cache-and-network',
        },
    );

    const enumsContextValue = useMemo<EnumsContextProps>(
        () => ({
            enums: enumsResult.data,
            taskById: listToMap(
                enumsResult.data?.private.allActiveTasks,
                ({ id }) => id,
            ),
            statusByKey: listToMap(
                enumsResult.data?.enums.TimeEntryStatus,
                ({ key }) => key,
            ),
            typeByKey: listToMap(
                enumsResult.data?.enums.TimeEntryType,
                ({ key }) => key,
            ),
        }),
        [enumsResult],
    );

    return (
        <EnumsContext.Provider value={enumsContextValue}>
            {children}
        </EnumsContext.Provider>
    );
}

export default EnumsProvider;
