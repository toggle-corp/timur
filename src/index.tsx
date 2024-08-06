import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { isNotDefined } from '@togglecorp/fujs';
import {
    cacheExchange,
    Client as UrqlClient,
    fetchExchange,
    Provider as UrqlProvider,
} from 'urql';

import App from './App/index.tsx';

const webappRootId = 'webapp-root';
const webappRootElement = document.getElementById(webappRootId);

const gqlClient = new UrqlClient({
    url: import.meta.env.APP_GRAPHQL_ENDPOINT,
    exchanges: [cacheExchange, fetchExchange],
    fetchOptions: () => ({
        credentials: 'include',
    }),
});

if (isNotDefined(webappRootElement)) {
    // eslint-disable-next-line no-console
    console.error(`Could not find html element with id '${webappRootId}'`);
} else {
    ReactDOM.createRoot(webappRootElement).render(
        <React.StrictMode>
            <UrqlProvider value={gqlClient}>
                <App />
            </UrqlProvider>
        </React.StrictMode>,
    );
}
