import {
    Fragment,
    type ReactElement,
} from 'react';
import {
    Navigate,
    useParams,
} from 'react-router-dom';

import { Component as TemplateView } from '#components/TemplateView';
import useAuth from '#hooks/useAuth';
import usePermissions from '#hooks/usePermissions';

import { type ExtendedProps } from './common';

interface Props {
    children: ReactElement,
    context: ExtendedProps,
    absolutePath: string,
}
function Auth(props: Props) {
    const {
        context,
        children,
        absolutePath,
    } = props;

    const urlParams = useParams();
    const perms = usePermissions();

    const { isAuthenticated } = useAuth();

    if (context.visibility === 'is-authenticated' && !isAuthenticated) {
        return (
            <Navigate to="/login" />
        );
    }
    if (context.visibility === 'is-not-authenticated' && isAuthenticated) {
        return (
            <Navigate to="/" />
        );
    }

    if (context.permissions) {
        const hasPermission = context.permissions(perms, urlParams);

        if (!hasPermission) {
            return (
                <TemplateView
                    title="403"
                    description="You are not authorized to view this page"
                />
            );
        }
    }

    return (
        <Fragment
            key={absolutePath}
        >
            {children}
        </Fragment>
    );
}

export default Auth;
