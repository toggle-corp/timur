import {
    useCallback,
    useContext,
} from 'react';
import {
    IoBookOutline,
    IoDesktopOutline,
} from 'react-icons/io5';
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
                className={styles.calendar}
                year={today.getFullYear()}
                month={today.getMonth()}
                onDateClick={handleDateClick}
            />
            <div className={styles.quickLinks}>
                <Link
                    linkElementClassName={styles.link}
                    to="dailyJournal"
                    icons={<IoBookOutline className={styles.icon} />}
                >
                    Daily Journal
                </Link>
                <Link
                    to="dailyStandup"
                    linkElementClassName={styles.link}
                    icons={<IoDesktopOutline className={styles.icon} />}
                >
                    Daily standup
                </Link>
            </div>
        </Page>
    );
}

Component.displayName = 'Home';
