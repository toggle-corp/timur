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
import RouteContext from '#contexts/route';

import styles from './styles.module.css';

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const routes = useContext(RouteContext);
    const navigate = useNavigate();

    const handleDateClick = useCallback((dateStr: string) => {
        const todayStr = encodeDate(new Date());
        const newDate = dateStr === todayStr ? undefined : dateStr;

        const { resolvedPath } = resolvePath('dailyJournal', routes, { date: newDate });
        if (isNotDefined(resolvedPath)) {
            return;
        }

        navigate(resolvedPath);
    }, [navigate, routes]);

    const today = new Date();

    return (
        <Page
            documentTitle="Timur - Home"
            className={styles.home}
            contentClassName={styles.mainContent}
        >
            <MonthlyCalendar
                selectedDate={undefined}
                className={styles.calendar}
                initialYear={today.getFullYear()}
                initialMonth={today.getMonth()}
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
