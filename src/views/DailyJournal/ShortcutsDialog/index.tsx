import {
    useCallback,
    useEffect,
    useState,
} from 'react';

import Dialog from '#components/Dialog';

import styles from './styles.module.css';

interface Props {
    dialogOpenTriggerRef: React.RefObject<(() => void) | undefined>;
}

function ShortcutsDialog(props: Props) {
    const {
        dialogOpenTriggerRef,
    } = props;

    const [showDialog, setShowDialog] = useState(false);

    useEffect(() => {
        dialogOpenTriggerRef.current = () => {
            setShowDialog(true);
        };
    }, [dialogOpenTriggerRef]);

    const handleModalClose = useCallback(() => {
        setShowDialog(false);
    }, []);

    return (
        <Dialog
            size="auto"
            open={showDialog}
            onClose={handleModalClose}
            heading="Shortcuts"
            contentClassName={styles.modalContent}
            className={styles.shortcutsDialog}
            closeOnOutsideClick
        >
            <h5 className={styles.subheading}>
                Entry
            </h5>
            <div className={styles.description}>
                Add a new entry
            </div>
            <kbd className={styles.key}>
                Ctrl+Space
            </kbd>
            <div className={styles.description}>
                Assist on the focused entry
            </div>
            <kbd className={styles.key}>
                Ctrl+Enter
            </kbd>
            <div className={styles.description}>
                Clone the focused entry
            </div>
            <kbd className={styles.key}>
                Ctrl+Shift+Enter
            </kbd>

            <h5 className={styles.subheading}>
                Navigation
            </h5>
            <div className={styles.description}>
                Previous day
            </div>
            <kbd className={styles.key}>
                Ctrl+Shift+Left
            </kbd>
            <div className={styles.description}>
                Next day
            </div>
            <kbd className={styles.key}>
                Ctrl+Shift+Right
            </kbd>
            <div className={styles.description}>
                Present day
            </div>
            <kbd className={styles.key}>
                Ctrl+Shift+Down
            </kbd>

            <h5 className={styles.subheading}>
                Help
            </h5>
            <div className={styles.description}>
                View shortcuts
            </div>
            <kbd className={styles.key}>
                Ctrl+Shift+?
            </kbd>
        </Dialog>
    );
}

export default ShortcutsDialog;
