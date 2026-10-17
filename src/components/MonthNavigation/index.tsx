import { useContext } from 'react';
import {
    RiArrowLeftSLine,
    RiArrowRightSLine,
    RiCalendarEventLine,
} from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';

import Link, {
    type Props as LinkProps,
    resolvePath,
} from '#components/Link';
import RouteContext from '#contexts/route';
import useKeybind from '#hooks/useKeybind';
import {
    addMonths,
    getMonthSearch,
} from '#utils/month';

type InternalLinkProps = Extract<LinkProps, { external?: never }>;

type Props = {
    to: NonNullable<InternalLinkProps['to']>;
    urlParams?: InternalLinkProps['urlParams'];
    month: string;
    // The latest month that can be shown, and the default
    currentMonth: string;
    currentMonthTitle?: string;
    // Ctrl+Shift with the left, right and down arrows, as in the journal
    withShortcuts?: boolean;
} & ({
    // The month goes in this path parameter, and urlSearch is kept
    monthPathParam: string;
    urlSearch?: string;
} | {
    monthPathParam?: never;
    urlSearch?: never;
});

const shortcuts = {
    previous: { key: 'ArrowLeft', symbol: '←' },
    next: { key: 'ArrowRight', symbol: '→' },
    current: { key: 'ArrowDown', symbol: '↓' },
};

// Previous, next and current month links; the current month stays out of the URL
function MonthNavigation(props: Props) {
    const {
        to,
        urlParams,
        month,
        currentMonth,
        currentMonthTitle = 'Jump to this month',
        monthPathParam,
        urlSearch,
        withShortcuts,
    } = props;

    const routes = useContext(RouteContext);
    const navigate = useNavigate();

    const nextMonth = addMonths(month, 1);

    const getMonthLinkProps = (target: string) => {
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
    };

    // Undefined where the link is disabled
    const shortcutTargets: Record<string, string | undefined> = {
        [shortcuts.previous.key]: addMonths(month, -1),
        [shortcuts.next.key]: nextMonth > currentMonth ? undefined : nextMonth,
        [shortcuts.current.key]: month === currentMonth ? undefined : currentMonth,
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (!withShortcuts || !event.ctrlKey || !event.shiftKey
            || !(event.key in shortcutTargets)) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const target = shortcutTargets[event.key];
        if (!target) {
            return;
        }
        const linkProps = getMonthLinkProps(target);
        const { resolvedPath } = resolvePath(to, routes, linkProps.urlParams);
        if (resolvedPath) {
            navigate({ pathname: resolvedPath, search: linkProps.urlSearch });
        }
    };

    useKeybind(handleKeyDown);

    const getShortcutProps = (title: string, shortcut: typeof shortcuts.next) => (
        withShortcuts ? {
            title: `${title} (Ctrl+Shift+${shortcut.symbol})`,
            'aria-keyshortcuts': `Control+Shift+${shortcut.key}`,
        } : { title }
    );

    return (
        <>
            <Link
                to={to}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...getMonthLinkProps(addMonths(month, -1))}
                variant="tertiary"
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...getShortcutProps('Previous month', shortcuts.previous)}
            >
                <RiArrowLeftSLine />
            </Link>
            <Link
                to={to}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...getMonthLinkProps(nextMonth)}
                variant="tertiary"
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...getShortcutProps('Next month', shortcuts.next)}
                disabled={nextMonth > currentMonth}
            >
                <RiArrowRightSLine />
            </Link>
            <Link
                to={to}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...getMonthLinkProps(currentMonth)}
                variant="tertiary"
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...getShortcutProps(currentMonthTitle, shortcuts.current)}
                disabled={month === currentMonth}
            >
                <RiCalendarEventLine />
            </Link>
        </>
    );
}

export default MonthNavigation;
