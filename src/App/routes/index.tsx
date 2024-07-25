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

const register = customWrapRoute({
    parent: rootLayout,
    path: 'register',
    component: {
        render: () => import('#components/TemplateView'),
        props: {
            title: 'Register',
        },
    },
    wrapperComponent: Auth,
    context: {
        title: 'Register',
        visibility: 'is-not-authenticated',
    },
});

const home = customWrapRoute({
    parent: rootLayout,
    index: true,
    component: {
        render: () => import('#components/TemplateView'),
        props: {
            title: 'Home',
        },
    },
    wrapperComponent: Auth,
    context: {
        title: 'Home',
        visibility: 'anything',
    },
});

// Redirect Routes

const wrappedRoutes = {
    fourHundredFour,
    rootLayout,
    login,
    register,
    home,
};

export const unwrappedRoutes = unwrapRoute(Object.values(wrappedRoutes));

export default wrappedRoutes;

export type WrappedRoutes = typeof wrappedRoutes;
