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
import {
    gql,
    useQuery,
} from 'urql';

import EnumsContext from '#contexts/enums';
import RouteContext from '#contexts/route';
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

import timurLogo from './icon.svg';
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
                        client {
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
    // AUTH
    const [userAuth, setUserAuth] = useState<UserAuth>();
    const [meResult] = useQuery<MeQuery, MeQueryVariables>(
        { query: ME_QUERY },
    );
    useEffect(() => {
        setUserAuth(meResult.data?.public.me ?? undefined);
    }, [meResult.data]);

    const [enumsResult] = useQuery<EnumsQuery, EnumsQueryVariables>(
        { query: ENUMS_QUERY },
    );

    const removeUserAuth = useCallback(() => {
        setUserAuth(undefined);
    }, []);

    const setAndStoreUserAuth = useCallback((newUserDetails: UserAuth) => {
        setUserAuth(newUserDetails);
    }, []);

    const userContextValue = useMemo<UserContextProps>(
        () => ({
            userAuth,
            setUserAuth: setAndStoreUserAuth,
            removeUserAuth,
        }),
        [userAuth, setAndStoreUserAuth, removeUserAuth],
    );
    const enumsContextValue = useMemo(() => ({ enums: enumsResult.data }), [enumsResult]);

    return (
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
                                    src={timurLogo}
                                />
                                Timur loading...
                            </div>
                        )}
                    />
                </EnumsContext.Provider>
            </UserContext.Provider>
        </RouteContext.Provider>
    );
}

export default App;
