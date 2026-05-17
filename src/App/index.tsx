import {
    createBrowserRouter,
    RouterProvider,
} from 'react-router-dom';
import * as Sentry from '@sentry/react';
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';
import { cacheExchange } from '@urql/exchange-graphcache';
import {
    Client as UrqlClient,
    fetchExchange,
    Provider as UrqlProvider,
} from 'urql';

import RouteContext from '#contexts/route';
import icon from '#resources/icon.svg';

import AuthProvider from './providers/AuthProvider';
import CommandProvider from './providers/CommandProvider';
import DateProvider from './providers/DateProvider';
import EnumsProvider from './providers/EnumsProvider';
import LocalStorageProvider from './providers/LocalStorageProvider';
import NavbarProvider from './providers/NavbarProvider';
import SizeProvider from './providers/SizeProvider';
import ThemeProvider from './providers/ThemeProvider';
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
            DailyHoursType: () => null,
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

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
        },
    },
});

const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouter(
    createBrowserRouter,
);

const router = sentryCreateBrowserRouter(unwrappedRoutes);

const fallbackElement = (
    <div className={styles.fallbackElement}>
        <img
            className={styles.appLogo}
            alt="Timur Icon"
            src={icon}
        />
    </div>
);

function App() {
    return (
        <>
            <PwaPrompt />
            <UrqlProvider value={gqlClient}>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <DateProvider>
                            <NavbarProvider>
                                <SizeProvider>
                                    <LocalStorageProvider>
                                        <ThemeProvider>
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
                                        </ThemeProvider>
                                    </LocalStorageProvider>
                                </SizeProvider>
                            </NavbarProvider>
                        </DateProvider>
                    </AuthProvider>
                </QueryClientProvider>
            </UrqlProvider>
        </>
    );
}

export default App;
