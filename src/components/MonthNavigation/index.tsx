import {
    RiArrowLeftSLine,
    RiArrowRightSLine,
    RiCalendarEventLine,
} from 'react-icons/ri';

import Link from '#components/Link';
import useKeybind from '#hooks/useKeybind';
import { addMonths } from '#utils/month';

import useMonthNavigation, { type MonthNavigationOptions } from './useMonthNavigation';

type Props = MonthNavigationOptions & {
    month: string;
    currentMonthTitle?: string;
    // Ctrl+Shift with the left, right and down arrows, as in the journal
    withShortcuts?: boolean;
};

const shortcuts = {
    previous: { key: 'ArrowLeft', symbol: '←' },
    next: { key: 'ArrowRight', symbol: '→' },
    current: { key: 'ArrowDown', symbol: '↓' },
};

// Previous, next and current month links; the current month stays out of the URL
function MonthNavigation(props: Props) {
    const {
        to,
        month,
        currentMonth,
        currentMonthTitle = 'Jump to this month',
        withShortcuts,
    } = props;

    const { getMonthLinkProps, goToMonth } = useMonthNavigation(props);

    const nextMonth = addMonths(month, 1);

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
        if (target) {
            goToMonth(target);
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
