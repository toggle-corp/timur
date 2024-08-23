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
            <Link to="dailyJournal">
                Goto daily Journal
            </Link>
            <Link to="dailyStandup">
                Daily standup
            </Link>
        </Page>
    );
}

Component.displayName = 'Home';
