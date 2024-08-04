import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import Dialog from '#components/Dialog';
import TextArea from '#components/TextArea';
import { Note } from '#utils/types';

import styles from './styles.module.css';

interface Props {
    dialogOpenTriggerRef: React.MutableRefObject<(() => void) | undefined>;
    note: Note | undefined;
    onNoteContentUpdate: (value: string | undefined, id: number | undefined) => void;
}

function AddWorkItemDialog(props: Props) {
    const {
        dialogOpenTriggerRef,
        note,
        onNoteContentUpdate,
    } = props;

    const [showAddWorkItemDialog, setShowAddWorkItemDialog] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        dialogOpenTriggerRef.current = () => {
            setShowAddWorkItemDialog(true);
        };
    }, [dialogOpenTriggerRef]);

    const handleModalClose = useCallback(() => {
        setShowAddWorkItemDialog(false);
    }, []);

    return (
        <Dialog
            open={showAddWorkItemDialog}
            mode="right"
            onClose={handleModalClose}
            heading="Notes"
            contentClassName={styles.modalContent}
            className={styles.updateNoteDialog}
            focusElementRef={titleInputRef}
        >
            <TextArea
                inputElementRef={titleInputRef}
                placeholder="Your notes"
                name={note?.id}
                value={note?.content}
                variant="general"
                onChange={onNoteContentUpdate}
            />
        </Dialog>
    );
}

export default AddWorkItemDialog;
