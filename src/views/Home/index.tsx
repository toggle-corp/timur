import {
    IoBookOutline,
    IoDesktopOutline,
} from 'react-icons/io5';

import Link from '#components/Link';
import Page from '#components/Page';

import styles from './styles.module.css';

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    return (
        <Page
            documentTitle="Timur - Home"
            className={styles.home}
            contentClassName={styles.mainContent}
        >
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
