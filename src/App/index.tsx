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
    _cs,
    encodeDate,
    isDefined,
    listToMap,
} from '@togglecorp/fujs';
import { cacheExchange } from '@urql/exchange-graphcache';
import {
    Client as UrqlClient,
    fetchExchange,
    gql,
    Provider as UrqlProvider,
    useMutation,
    useQuery,
} from 'urql';

import CommandContext, { CommandContextProps } from '#contexts/command';
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
    BulkTimeEntryMutation,
    BulkTimeEntryMutationVariables,
    EnumsQuery,
    EnumsQueryVariables,
    MeQuery,
    MeQueryVariables,
} from '#generated/types/graphql';
import useThrottledValue from '#hooks/useThrottledValue';
import {
    AddCommand,
    Command,
    DeleteCommand,
    EditCommand,
} from '#utils/command';
import { getWindowSize } from '#utils/common';
import { defaultConfigValue } from '#utils/constants';
import { getFromStorage } from '#utils/localStorage';
import {
    ConfigStorage,
    WorkItem,
} from '#utils/types';

import timurLogo from './icon.svg';
import PwaPrompt from './PwaPrompt';
import wrappedRoutes, { unwrappedRoutes } from './routes';

import styles from './styles.module.css';

const gqlClient = new UrqlClient({
    url: `${import.meta.env.APP_GRAPHQL_DOMAIN}/graphql/`,
    exchanges: [cacheExchange({
        keys: {
            PrivateQuery: () => null,
            PublicQuery: () => null,
            AppEnumCollection: () => null,
            DailyStandUpType: () => null,
            AppEnumCollectionTimeEntryType: (item) => String(item.key),
            AppEnumCollectionTimeEntryStatus: (item) => String(item.key),
            AppEnumCollectionJournalLeaveType: (item) => String(item.key),
            AppEnumCollectionJournalWfhType: (item) => String(item.key),
            DjangoImageType: (item) => String(item.url),
        },
    }), fetchExchange],
    fetchOptions: () => ({
        credentials: 'include',
    }),
    requestPolicy: 'network-only',
});

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
                loginExpire
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

const BULK_TIME_ENTRY_MUTATION = gql`
    mutation BulkTimeEntry($timeEntries: [TimeEntryBulkCreateInput!], $deleteIds: [ID!]) {
        private {
            bulkTimeEntry(
                items: $timeEntries,
                deleteIds: $deleteIds
            ) {
                deleted {
                    id
                    clientId
                }
                errors
                results {
                    id
                    clientId
                    date
                    description
                    duration
                    startTime
                    status
                    taskId
                    type
                }
            }
        }
    }
`;

const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouter(
    createBrowserRouter,
);

const router = sentryCreateBrowserRouter(unwrappedRoutes);

const fallbackElement = (
    <div className={styles.fallbackElement}>
        <img
            className={styles.appLogo}
            alt="Timur Icon"
            src="/app-icon.svg"
        />
    </div>
);

function isAddAction<T, K>(item: Command<T, K>): item is AddCommand<T, K> {
    return item.type === 'add';
}

function isEditAction<T, K>(item: Command<T, K>): item is EditCommand<T, K> {
    return item.type === 'edit';
}
function isDeleteAction<T, K>(item: Command<T, K>): item is DeleteCommand<T, K> {
    return item.type === 'delete';
}

interface BaseProps {
    children: React.ReactNode;
}

function AuthProvider(props: BaseProps) {
    const { children } = props;

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

    // NOTE: We should block page for authentication before we mount routes
    if (!ready) {
        // TODO: Handle error with authentication
        return fallbackElement;
    }

    return (
        <UserContext.Provider value={userContextValue}>
            {children}
        </UserContext.Provider>
    );
}

function DateProvider(props: BaseProps) {
    const { children } = props;

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

    return (
        <DateContext.Provider value={date}>
            {children}
        </DateContext.Provider>
    );
}

function NavbarProvider(props: BaseProps) {
    const { children } = props;
    const navbarStartActionRef = useRef<HTMLDivElement>(null);
    const navbarMidActionRef = useRef<HTMLDivElement>(null);
    const navbarEndActionRef = useRef<HTMLDivElement>(null);

    const navbarContextValue = useMemo<NavbarContextProps>(() => ({
        startActionsRef: navbarStartActionRef,
        midActionsRef: navbarMidActionRef,
        endActionsRef: navbarEndActionRef,
    }), []);

    return (
        <NavbarContext.Provider value={navbarContextValue}>
            {children}
        </NavbarContext.Provider>
    );
}

function SizeProvider(props: BaseProps) {
    const { children } = props;

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

    return (
        <SizeContext.Provider value={throttledSize}>
            {children}
        </SizeContext.Provider>
    );
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

function CommandProvider(props: BaseProps) {
    const { children } = props;

    const zeitgeist = useRef<number>(0);
    const commands = useRef<Command<WorkItem, string>[]>([]);
    const [undoable, setUndobale] = useState(false);
    const [redoable, setRedoable] = useState(false);
    const setCommands = useCallback(
        (value: Command<WorkItem, string>[]) => {
            commands.current = value;
            const forwardSpace = commands.current.length - zeitgeist.current;
            setRedoable(forwardSpace > 0);
            const backwardSpace = zeitgeist.current;
            setUndobale(backwardSpace > 0);
        },
        [],
    );

    const serverCommands = useRef<Command<WorkItem, string>[]>([]);
    const [
        serverCommandsLastUpdated,
        setServerCommandsLastUpdated,
    ] = useState<number | undefined>(undefined);
    const setServerCommands = useCallback(
        (value: Command<WorkItem, string>[]) => {
            serverCommands.current = value;
            if (serverCommands.current.length === 0) {
                setServerCommandsLastUpdated(undefined);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const val = serverCommands.current[serverCommands.current.length - 1]!.timestamp;
                setServerCommandsLastUpdated(val);
            }
        },
        [],
    );

    const inFlightServerCommands = useRef<Command<WorkItem, string>[]>([]);
    const [inFlight, setInFlight] = useState(false);

    const [
        ,
        triggerBulkMutation,
    ] = useMutation<BulkTimeEntryMutation, BulkTimeEntryMutationVariables>(
        BULK_TIME_ENTRY_MUTATION,
    );

    useEffect(
        () => {
            if (inFlight || !serverCommandsLastUpdated) {
                return;
            }

            if (serverCommands.current.length === 0) {
                return;
            }

            inFlightServerCommands.current = serverCommands.current.slice(0, 20);
            setServerCommands(serverCommands.current.slice(20));

            setInFlight(true);

            async function mutate() {
                try {
                    const addedItems = inFlightServerCommands.current.filter(isAddAction);
                    const editedItems = inFlightServerCommands.current.filter(isEditAction);
                    const deletedItems = inFlightServerCommands.current.filter(isDeleteAction);
                    // TODO: Use clientId instead in the id for edit and delete
                    const res = await triggerBulkMutation({
                        timeEntries: [
                            ...addedItems.map((item) => item.newValue),
                            ...editedItems.map((item) => ({
                                ...item.newValue,
                                clientId: item.key,
                            })),
                        ],
                        deleteIds: deletedItems.map((item) => item.oldValue.id).filter(isDefined),
                    });

                    // eslint-disable-next-line no-console
                    console.debug(res);
                } catch (ex) {
                    setServerCommands([
                        ...inFlightServerCommands.current,
                        ...serverCommands.current,
                    ]);
                }
                inFlightServerCommands.current = [];
                setInFlight(false);
            }

            // NOTE: This will act as a rate limit
            setTimeout(
                mutate,
                1000,
            );
        },
        [inFlight, serverCommandsLastUpdated, setServerCommands, triggerCudTimeEntryMutation],
    );

    const setZeitgeist = useCallback(
        (value: number) => {
            zeitgeist.current = value;
            const forwardSpace = commands.current.length - zeitgeist.current;
            setRedoable(forwardSpace > 0);
            const backwardSpace = zeitgeist.current;
            setUndobale(backwardSpace > 0);
        },
        [],
    );

    const watch = useCallback(
        (action: Command<WorkItem, string>) => {
            const oldActions = serverCommands.current;
            const existingActionIndex = oldActions.findIndex((item) => item.key === action.key);
            if (existingActionIndex === -1) {
                setServerCommands([...oldActions, action]);
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const existingAction = oldActions[existingActionIndex]!;
            const newActions = [...oldActions];
            if (existingAction.type === 'add' && action.type === 'delete') {
                // we remove from list
                newActions.splice(existingActionIndex, 1);
            } else if (existingAction.type === 'add' && action.type === 'edit') {
                // we update the add
                newActions.splice(
                    existingActionIndex,
                    1,
                    {
                        ...existingAction,
                        timestamp: action.timestamp,
                        newValue: {
                            ...existingAction.newValue,
                            ...action.newValue,
                        },
                    },
                );
            } else if (existingAction.type === 'edit' && action.type === 'edit') {
                // we update the edit
                newActions.splice(
                    existingActionIndex,
                    1,
                    {
                        ...existingAction,
                        timestamp: action.timestamp,
                        newValue: {
                            ...existingAction.newValue,
                            ...action.newValue,
                        },
                    },
                );
            } else if (existingAction.type === 'edit' && action.type === 'delete') {
                // we replace with delete
                newActions.splice(
                    existingActionIndex,
                    1,
                    action,
                );
            } else if (existingAction.type === 'delete' && action.type === 'add') {
                // we remove from list
                newActions.splice(
                    existingActionIndex,
                    1,
                );
            } else {
                // eslint-disable-next-line no-console
                console.error(`We previously had ${existingAction.type} but then we got ${action.type}`);
            }
            setServerCommands(newActions);
        },
        [setServerCommands],
    );

    const commandState = useMemo((): CommandContextProps => ({
        commands,
        zeitgeist,
        setZeitgeist,
        setCommands,
        watch,
        undoable,
        redoable,
    }), [watch, setZeitgeist, setCommands, undoable, redoable]);

    return (
        <CommandContext.Provider value={commandState}>
            {children}
            <div
                className={_cs(
                    styles.lastSavedStatus,
                    inFlight && styles.active,
                )}
            >
                <img
                    className={styles.timurIcon}
                    alt="Timur Icon"
                    src={timurLogo}
                />
                <div>
                    Committing...
                </div>
            </div>
        </CommandContext.Provider>
    );
}

function App() {
    return (
        <>
            <PwaPrompt />
            <UrqlProvider value={gqlClient}>
                <AuthProvider>
                    <DateProvider>
                        <NavbarProvider>
                            <SizeProvider>
                                <LocalStorageProvider>
                                    <EnumsProvider>
                                        <CommandProvider>
                                            <RouteContext.Provider value={wrappedRoutes}>
                                                <RouterProvider
                                                    router={router}
                                                    fallbackElement={fallbackElement}
                                                />
                                            </RouteContext.Provider>
                                        </CommandProvider>
                                    </EnumsProvider>
                                </LocalStorageProvider>
                            </SizeProvider>
                        </NavbarProvider>
                    </DateProvider>
                </AuthProvider>
            </UrqlProvider>
        </>
    );
}

export default App;
