import { useCallback } from 'react';
import { pwaInfo } from 'virtual:pwa-info';
import { useRegisterSW } from 'virtual:pwa-register/react';

import Button from '#components/Button';
import Dialog from '#components/Dialog';

import styles from './styles.module.css';

// eslint-disable-next-line no-console
console.info('PWA information:', pwaInfo);

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW: (swUrl, registration) => {
            // eslint-disable-next-line no-console
            console.info(`SW at: ${swUrl}`);
            if (registration) {
                setInterval(
                    () => {
                        // eslint-disable-next-line no-console
                        console.info('Checking for SW update');
                        registration.update();
                    },
                    20000,
                );
            } else {
                // eslint-disable-next-line no-console
                console.error('SW registration not defined');
            }
        },
        onRegisterError: (error) => {
            // eslint-disable-next-line no-console
            console.info('SW registration error', error);
        },
    });
    const reload = useCallback(
        () => {
            updateServiceWorker(true);
        },
        [updateServiceWorker],
    );

    const close = useCallback(
        () => {
            setOfflineReady(false);
            setNeedRefresh(false);
        },
        [setOfflineReady, setNeedRefresh],
    );

    if (!offlineReady && !needRefresh) {
        return null;
    }

    return (
        <Dialog
            open
            onClose={close}
            mode="center"
            heading="PWA"
            contentClassName={styles.modalContent}
            className={styles.promptDialog}
            size="auto"
        >
            <div>
                {offlineReady
                    ? 'App ready to work offline'
                    : 'New content available, click on reload button to update.'}
            </div>
            <div className={styles.actions}>
                <Button
                    title="Close SW update prompt"
                    name={undefined}
                    onClick={close}
                    variant="quaternary"
                >
                    Close
                </Button>
                {needRefresh && (
                    <Button
                        name={undefined}
                        title="Reload SW"
                        onClick={reload}
                        variant="primary"
                    >
                        Reload
                    </Button>
                )}
            </div>
        </Dialog>
    );
}

export default ReloadPrompt;
