import {
    createBrowserRouter,
    RouterProvider,
} from 'react-router-dom';
import * as Sentry from '@sentry/react';
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
