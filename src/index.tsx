import './index.css';

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import {
    createRoutesFromChildren,
    matchRoutes,
    useLocation,
    useNavigationType,
} from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { isNotDefined } from '@togglecorp/fujs';
import { cacheExchange } from '@urql/exchange-graphcache';
import {
    Client as UrqlClient,
    fetchExchange,
    Provider as UrqlProvider,
} from 'urql';

import { Component as TemplateView } from '#components/TemplateView';

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

const dsn = import.meta.env.APP_SENTRY_DSN;
if (dsn) {
    Sentry.init({
        dsn,
        integrations: [
            Sentry.reactRouterV6BrowserTracingIntegration({
                useEffect,
                useLocation,
                useNavigationType,
                createRoutesFromChildren,
                matchRoutes,
            }),
            Sentry.replayIntegration(),
        ],

        // Set tracesSampleRate to 1.0 to capture 100% of transactions for
        // tracing.
        tracesSampleRate: 1.0,

        // Set `tracePropagationTargets` to control for which URLs trace
        // propagation should be enabled
        tracePropagationTargets: [
            /^\//,
            // FIXME: move this to env later
            /^https:\/\/alpha-api\.timur\.dev\.togglecorp\.com\/graphql/,
        ],

        // Capture Replay for 10% of all sessions, plus for 100% of sessions
        // with an error
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
    });
}

if (isNotDefined(webappRootElement)) {
    // eslint-disable-next-line no-console
    console.error(`Could not find html element with id '${webappRootId}'`);
} else {
    ReactDOM.createRoot(webappRootElement).render(
        <React.StrictMode>
            <Sentry.ErrorBoundary
                fallback={(
                    <TemplateView
                        title="An error has occured!"
                        description={(
                            <>
                                The incident has been reported to Mr Nav.
                                <br />
                                See the console for more info!
                            </>
                        )}
                    />
                )}
                showDialog
            >
                <PwaPrompt />
                <UrqlProvider value={gqlClient}>
                    <App />
                </UrqlProvider>
            </Sentry.ErrorBoundary>
        </React.StrictMode>,
    );
}
