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
    settings,
};

export const unwrappedRoutes = unwrapRoute(Object.values(wrappedRoutes));

export default wrappedRoutes;

export type WrappedRoutes = typeof wrappedRoutes;
