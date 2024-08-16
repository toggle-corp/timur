import Checkbox from '#components/Checkbox';
import Page from '#components/Page';
import useLocalStorage from '#hooks/useLocalStorage';
import useSetFieldValue from '#hooks/useSetFieldValue';
import {
    defaultConfigValue,
    KEY_CONFIG_STORAGE,
} from '#utils/constants';
import { ConfigStorage } from '#utils/types';

import styles from './styles.module.css';

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const [storedState, setStoredState] = useLocalStorage<ConfigStorage>(
        KEY_CONFIG_STORAGE,
        defaultConfigValue,
    );

    const setFieldValue = useSetFieldValue(setStoredState);

    return (
        <Page
            documentTitle="Settings"
            className={styles.settings}
            contentClassName={styles.mainContent}
        >
            <h2>
                Settings
            </h2>
            <Checkbox
                name="allowMultipleEntry"
                label="Allow multiple entry"
                description="When inside the add entry modal, persist the modal even after adding a new entry. This options is helpful when you're adding entry in bulk."
                value={storedState.allowMultipleEntry}
                onChange={setFieldValue}
            />
            <Checkbox
                name="checkboxForStatus"
                label="Use checkbox for status"
                description="Use checkbox instead of select input for the status. i.e. to toggle TODO, Doing and Done"
                value={storedState.checkboxForStatus}
                onChange={setFieldValue}
            />
            <Checkbox
                name="focusMode"
                label="Enable focus mode"
                description="Focus mode will remove all of the visual distraction from the page and allows you to focus on writing the journal"
                value={storedState.focusMode}
                onChange={setFieldValue}
            />
        </Page>
    );
}

Component.displayName = 'Settings';
