import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { isNotDefined } from '@togglecorp/fujs';
import { cacheExchange } from '@urql/exchange-graphcache';
import {
    Client as UrqlClient,
    fetchExchange,
    Provider as UrqlProvider,
} from 'urql';

import App from './App/index.tsx';
import PwaPrompt from './PwaPrompt/index.tsx';

const webappRootId = 'webapp-root';
const webappRootElement = document.getElementById(webappRootId);

const gqlClient = new UrqlClient({
    url: import.meta.env.APP_GRAPHQL_ENDPOINT,
    exchanges: [cacheExchange({
        keys: {
            PrivateQuery: () => null,
            PublicQuery: () => null,
            AppEnumCollection: () => null,
            AppEnumCollectionTimeEntryType: (item) => String(item.key),
            AppEnumCollectionTimeEntryStatus: (item) => String(item.key),
            AppEnumCollectionJournalLeaveType: (item) => String(item.key),
        },
    }), fetchExchange],
    fetchOptions: () => ({
        credentials: 'include',
    }),
    requestPolicy: 'network-only',
});

if (isNotDefined(webappRootElement)) {
    // eslint-disable-next-line no-console
    console.error(`Could not find html element with id '${webappRootId}'`);
} else {
    ReactDOM.createRoot(webappRootElement).render(
        <React.StrictMode>
            <PwaPrompt />
            <UrqlProvider value={gqlClient}>
                <App />
            </UrqlProvider>
        </React.StrictMode>,
    );
}
