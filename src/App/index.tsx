import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    createBrowserRouter,
    RouterProvider,
} from 'react-router-dom';
import { listToMap } from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import EnumsContext, { EnumsContextProps } from '#contexts/enums';
import LocalStorageContext, { LocalStorageContextProps } from '#contexts/localStorage';
import RouteContext from '#contexts/route';
import SizeContext, { SizeContextProps } from '#contexts/size';
import UserContext, {
    UserAuth,
    UserContextProps,
} from '#contexts/user';
import {
    EnumsQuery,
    EnumsQueryVariables,
    MeQuery,
    MeQueryVariables,
} from '#generated/types/graphql';
import useDebouncedValue from '#hooks/useDebouncedValue';
import { getWindowSize } from '#utils/common';
import { setToStorage } from '#utils/localStorage';

import wrappedRoutes, { unwrappedRoutes } from './routes';

import styles from './styles.module.css';

const ME_QUERY = gql`
    query Me {
        public {
            id
            me {
                displayName
                displayPicture
                email
                firstName
                id
                lastName
            }
        }
    }
`;

const ENUMS_QUERY = gql`
    query Enums {
        enums {
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

const router = createBrowserRouter(unwrappedRoutes);

function App() {
    const [userAuth, setUserAuth] = useState<UserAuth>();
    const [size, setSize] = useState<SizeContextProps>(getWindowSize);
    const [storageState, setStorageState] = useState<LocalStorageContextProps['storageState']>({});

    useEffect(() => {
        Object.keys(storageState).forEach((key) => {
            setToStorage(key, storageState[key].value);
        });
    }, [storageState]);

    const debouncedSize = useDebouncedValue(size);

    useEffect(() => {
        function handleResize() {
            setSize(getWindowSize());
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const [meResult] = useQuery<MeQuery, MeQueryVariables>(
        { query: ME_QUERY },
    );
    useEffect(() => {
        setUserAuth(meResult.data?.public.me ?? undefined);
    }, [meResult.data]);

    const [enumsResult] = useQuery<EnumsQuery, EnumsQueryVariables>(
        { query: ENUMS_QUERY },
    );

    const removeUserAuth = useCallback(
        () => {
            setUserAuth(undefined);
        },
        [],
    );

    const userContextValue = useMemo<UserContextProps>(
        () => ({
            userAuth,
            setUserAuth,
            removeUserAuth,
        }),
        [userAuth, removeUserAuth],
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

    const storageContextValue = useMemo<LocalStorageContextProps>(() => ({
        storageState,
        setStorageState,
    }), [storageState]);

    return (
        <SizeContext.Provider value={debouncedSize}>
            <LocalStorageContext.Provider value={storageContextValue}>
                <RouteContext.Provider value={wrappedRoutes}>
                    <UserContext.Provider value={userContextValue}>
                        <EnumsContext.Provider value={enumsContextValue}>
                            <RouterProvider
                                router={router}
                                fallbackElement={(
                                    <div className={styles.fallbackElement}>
                                        <img
                                            className={styles.appLogo}
                                            alt="Timur Icon"
                                            src="/app-icon.svg"
                                        />
                                    </div>
                                )}
                            />
                        </EnumsContext.Provider>
                    </UserContext.Provider>
                </RouteContext.Provider>
            </LocalStorageContext.Provider>
        </SizeContext.Provider>
    );
}

export default App;
