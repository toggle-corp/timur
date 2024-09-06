import {
    useCallback,
    useContext,
} from 'react';
import {
    FcCalendar,
    FcSettings,
    FcVoicePresentation,
} from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import {
    encodeDate,
    isNotDefined,
} from '@togglecorp/fujs';

import Link, { resolvePath } from '#components/Link';
import MonthlyCalendar from '#components/MonthlyCalendar';
import Page from '#components/Page';
import DateContext from '#contexts/date';
import RouteContext from '#contexts/route';

import styles from './styles.module.css';

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const routes = useContext(RouteContext);
    const navigate = useNavigate();

    const { year, month, fullDate } = useContext(DateContext);

    const handleDateClick = useCallback((dateStr: string) => {
        const newDate = dateStr === fullDate ? undefined : dateStr;

        const { resolvedPath } = resolvePath('dailyJournal', routes, { date: newDate });
        if (isNotDefined(resolvedPath)) {
            return;
        }

        navigate(resolvedPath);
    }, [navigate, routes, fullDate]);

    return (
        <Page
            documentTitle="Timur - Home"
            className={styles.home}
            contentClassName={styles.mainContent}
        >
            <MonthlyCalendar
                selectedDate={undefined}
                className={styles.calendar}
                initialYear={year}
                initialMonth={month}
                onDateClick={handleDateClick}
            />
            <div className={styles.quickLinks}>
                <Link
                    linkElementClassName={styles.link}
                    to="dailyJournal"
                    icons={<FcCalendar className={styles.icon} />}
                >
                    Daily Journal
                </Link>
                <Link
                    to="dailyStandup"
                    linkElementClassName={styles.link}
                    icons={<FcVoicePresentation className={styles.icon} />}
                >
                    Standup Deck
                </Link>
                <Link
                    to="settings"
                    linkElementClassName={styles.link}
                    icons={<FcSettings className={styles.icon} />}
                >
                    Settings
                </Link>
            </div>
        </Page>
    );
}

Component.displayName = 'Home';
