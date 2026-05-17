import './themes.css';
import './index.css';

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import {
    createRoutesFromChildren,
    matchRoutes,
    useLocation,
    useNavigationType,
} from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import * as Sentry from '@sentry/react';
import { isNotDefined } from '@togglecorp/fujs';

import { Component as TemplateView } from '#components/TemplateView';

import App from './App/index.tsx';
import { bootstrapTheme } from './App/providers/ThemeProvider.tsx';

bootstrapTheme();

const webappRootId = 'webapp-root';
const webappRootElement = document.getElementById(webappRootId);

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
            // FIXME: move this to .env
            /^https:\/\/local\.timur\.dev\.togglecorp\.com:3000/,
            /^https:\/\/timur\.dev\.togglecorp\.com/,
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
    const component = (
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
                <GoogleOAuthProvider clientId={import.meta.env.APP_GOOGLE_OAUTH_CLIENT_ID ?? ''}>
                    <App />
                </GoogleOAuthProvider>
            </Sentry.ErrorBoundary>
        </React.StrictMode>
    );
    ReactDOM.createRoot(webappRootElement).render(component);
}
