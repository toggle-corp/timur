import Page from '#components/Page';

import styles from './styles.module.css';

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    return (
        <Page
            documentTitle="Settings"
            className={styles.settings}
            contentClassName={styles.mainContent}
        >
            <h2>
                Settings
            </h2>
            <p>
                No settings to configure
            </p>
        </Page>
    );
}

Component.displayName = 'Settings';
