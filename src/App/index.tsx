import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    createBrowserRouter,
    RouterProvider,
} from 'react-router-dom';
import * as Sentry from '@sentry/react';
import {
    encodeDate,
    listToMap,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import DateContext from '#contexts/date';
import EnumsContext, { EnumsContextProps } from '#contexts/enums';
import LocalStorageContext, { LocalStorageContextProps } from '#contexts/localStorage';
import NavbarContext, { NavbarContextProps } from '#contexts/navbar';
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
import useThrottledValue from '#hooks/useThrottledValue';
import { getWindowSize } from '#utils/common';
import { defaultConfigValue } from '#utils/constants';

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
                isStaff
            }
        }
    }
`;

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

const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouter(
    createBrowserRouter,
);

const router = sentryCreateBrowserRouter(unwrappedRoutes);

function App() {
    // Date

    const [date, setDate] = useState(() => {
        const today = new Date();
        return {
            fullDate: encodeDate(today),
            year: today.getFullYear(),
            month: today.getMonth(),
            day: today.getDate(),
        };
    });

    useEffect(
        () => {
            const timeout = window.setInterval(
                () => {
                    setDate((oldValue) => {
                        const today = new Date();
                        const newDateString = encodeDate(today);
                        if (oldValue.fullDate === newDateString) {
                            return oldValue;
                        }
                        return {
                            fullDate: newDateString,
                            year: today.getFullYear(),
                            month: today.getMonth(),
                            day: today.getDate(),
                        };
                    });
                },
                2000,
            );
            return () => {
                window.clearInterval(timeout);
            };
        },
        [],
    );

    // Local Storage

    const [storageState, setStorageState] = useState<LocalStorageContextProps['storageState']>({
        'timur-config': {
            defaultValue: defaultConfigValue,
        },
    });

    const storageContextValue = useMemo<LocalStorageContextProps>(() => ({
        storageState,
        setStorageState,
    }), [storageState]);

    // Device Size

    const [size, setSize] = useState<SizeContextProps>(getWindowSize);
    const throttledSize = useThrottledValue(size);
    useEffect(() => {
        function handleResize() {
            setSize(getWindowSize());
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Authentication

    const [userAuth, setUserAuth] = useState<UserAuth>();
    const [ready, setReady] = useState(false);

    const [meResult] = useQuery<MeQuery, MeQueryVariables>(
        { query: ME_QUERY },
    );

    useEffect(() => {
        if (meResult.fetching) {
            return;
        }
        setUserAuth(meResult.data?.public.me ?? undefined);
        setReady(true);
    }, [meResult.data, meResult.fetching]);

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

    // Enums

    const [enumsResult] = useQuery<EnumsQuery, EnumsQueryVariables>(
        { query: ENUMS_QUERY },
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

    // Page layouts

    const navbarStartActionRef = useRef<HTMLDivElement>(null);
    const navbarMidActionRef = useRef<HTMLDivElement>(null);
    const navbarEndActionRef = useRef<HTMLDivElement>(null);

    const navbarContextValue = useMemo<NavbarContextProps>(() => ({
        startActionsRef: navbarStartActionRef,
        midActionsRef: navbarMidActionRef,
        endActionsRef: navbarEndActionRef,
    }), []);

    // Route

    const fallbackElement = (
        <div className={styles.fallbackElement}>
            <img
                className={styles.appLogo}
                alt="Timur Icon"
                src="/app-icon.svg"
            />
        </div>
    );

    // NOTE: We should block page for authentication before we mount routes
    // TODO: Handle error with authentication
    if (!ready) {
        return fallbackElement;
    }

    return (
        <NavbarContext.Provider value={navbarContextValue}>
            <DateContext.Provider value={date}>
                <SizeContext.Provider value={throttledSize}>
                    <LocalStorageContext.Provider value={storageContextValue}>
                        <RouteContext.Provider value={wrappedRoutes}>
                            <UserContext.Provider value={userContextValue}>
                                <EnumsContext.Provider value={enumsContextValue}>
                                    <RouterProvider
                                        router={router}
                                        fallbackElement={fallbackElement}
                                    />
                                </EnumsContext.Provider>
                            </UserContext.Provider>
                        </RouteContext.Provider>
                    </LocalStorageContext.Provider>
                </SizeContext.Provider>
            </DateContext.Provider>
        </NavbarContext.Provider>
    );
}

export default App;
