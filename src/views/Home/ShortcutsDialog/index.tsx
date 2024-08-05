import {
    useCallback,
    useEffect,
    useState,
} from 'react';

import Dialog from '#components/Dialog';

import styles from './styles.module.css';

interface Props {
    dialogOpenTriggerRef: React.MutableRefObject<(() => void) | undefined>;
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
            open={showDialog}
            mode="right"
            onClose={handleModalClose}
            heading="Shortcuts"
            contentClassName={styles.modalContent}
            className={styles.shortcutsDialog}
        >
            <div>
                Hit
                {' '}
                <code>Ctrl+Space</code>
                {' '}
                to add a new entry.
            </div>
            <div>
                Hit
                {' '}
                <code>Ctrl+Enter</code>
                {' '}
                to add a new note.
            </div>
            <div>
                Hit
                {' '}
                <code>Ctrl+Shift+Left</code>
                {' '}
                to go to previous day.
            </div>
            <div>
                Hit
                {' '}
                <code>Ctrl+Shift+Right</code>
                {' '}
                to go to next day.
            </div>
            <div>
                Hit
                {' '}
                <code>Ctrl+Shift+Down</code>
                {' '}
                to go to present day.
            </div>
        </Dialog>
    );
}

export default ShortcutsDialog;
