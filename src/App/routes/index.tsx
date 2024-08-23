import { unwrapRoute } from '#utils/routes';

import Auth from './Auth';
import {
    customWrapRoute,
    rootLayout,
} from './common';

const fourHundredFour = customWrapRoute({
    parent: rootLayout,
    path: '*',
    component: {
        render: () => import('#components/TemplateView'),
        props: {
            title: '404',
        },
    },
    context: {
        title: '404',
        visibility: 'anything',
    },
});

const login = customWrapRoute({
    parent: rootLayout,
    path: 'login',
    component: {
        render: () => import('#components/TemplateView'),
        props: {
            title: 'Login',
        },
    },
    wrapperComponent: Auth,
    context: {
        title: 'Login',
        visibility: 'is-not-authenticated',
    },
});

const home = customWrapRoute({
    parent: rootLayout,
    index: true,
    component: {
        render: () => import('#views/Home'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Home',
        visibility: 'is-authenticated',
    },
});

const dailyJournal = customWrapRoute({
    parent: rootLayout,
    path: 'daily-journal/:date?',
    component: {
        render: () => import('#views/DailyJournal'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Daily Journal',
        visibility: 'is-authenticated',
    },
});

const dailyStandup = customWrapRoute({
    parent: rootLayout,
    path: 'daily-standup/:date?',
    component: {
        render: () => import('#views/DailyStandup'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Daily Standup',
        visibility: 'is-authenticated',
    },
});

const settings = customWrapRoute({
    parent: rootLayout,
    path: 'settings',
    component: {
        render: () => import('#views/Settings'),
        props: {},
    },
    wrapperComponent: Auth,
    context: {
        title: 'Settings',
        visibility: 'is-authenticated',
    },
});

const wrappedRoutes = {
    fourHundredFour,
    rootLayout,
    login,
    home,
    dailyJournal,
    dailyStandup,
    settings,
};

export const unwrappedRoutes = unwrapRoute(Object.values(wrappedRoutes));

export default wrappedRoutes;

export type WrappedRoutes = typeof wrappedRoutes;
