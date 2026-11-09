import {
    useCallback,
    useContext,
} from 'react';
import { useNavigate } from 'react-router-dom';

import {
    type Props as LinkProps,
    resolvePath,
} from '#components/Link';
import RouteContext from '#contexts/route';
import { getMonthSearch } from '#utils/month';

type InternalLinkProps = Extract<LinkProps, { external?: never }>;

export type MonthNavigationOptions = {
    to: NonNullable<InternalLinkProps['to']>;
    urlParams?: InternalLinkProps['urlParams'];
    // The latest month that can be shown, and the default
    currentMonth: string;
} & ({
    // The month goes in this path parameter, and urlSearch is kept
    monthPathParam: string;
    urlSearch?: string;
} | {
    monthPathParam?: never;
    urlSearch?: never;
});

// Links to a month, and navigation to it; the current month stays out of the URL
function useMonthNavigation(options: MonthNavigationOptions) {
    const {
        to,
        urlParams,
        currentMonth,
        monthPathParam,
        urlSearch,
    } = options;

    const routes = useContext(RouteContext);
    const navigate = useNavigate();

    const getMonthLinkProps = useCallback(
        (target: string) => {
            if (monthPathParam) {
                return {
                    urlParams: {
                        ...urlParams,
                        [monthPathParam]: target === currentMonth ? undefined : target,
                    },
                    urlSearch,
                };
            }
            return {
                urlParams,
                urlSearch: getMonthSearch(target, currentMonth),
            };
        },
        [monthPathParam, urlParams, urlSearch, currentMonth],
    );

    const goToMonth = useCallback(
        (target: string) => {
            const linkProps = getMonthLinkProps(target);
            const { resolvedPath } = resolvePath(to, routes, linkProps.urlParams);
            if (resolvedPath) {
                navigate({ pathname: resolvedPath, search: linkProps.urlSearch });
            }
        },
        [getMonthLinkProps, to, routes, navigate],
    );

    return { getMonthLinkProps, goToMonth };
}

export default useMonthNavigation;
