import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    markdown,
    markdownLanguage,
} from '@codemirror/lang-markdown';
import {
    Vim,
    vim,
} from '@replit/codemirror-vim';
import { githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';

import Dialog from '#components/Dialog';
import {
    EditingMode,
    Note,
} from '#utils/types';

import styles from './styles.module.css';

const extensionsWithoutVim = [markdown({ base: markdownLanguage })];
const extensionsWithVim = [...extensionsWithoutVim, vim()];

interface Props {
    dialogOpenTriggerRef: React.MutableRefObject<(() => void) | undefined>;
    note: Note | undefined;
    onNoteContentUpdate: (value: string | undefined, id: string | undefined) => void;
    editingMode: EditingMode,
    // onEditingModeChange: React.Dispatch<React.SetStateAction<EditingMode>>
}

function AddNoteDialog(props: Props) {
    const {
        dialogOpenTriggerRef,
        note,
        onNoteContentUpdate,
        editingMode,
        // onEditingModeChange,
    } = props;

    const refs = useRef<ReactCodeMirrorRef>({});

    const [showDialog, setShowDialog] = useState(false);

    useEffect(() => {
        dialogOpenTriggerRef.current = () => {
            setShowDialog(true);
        };
    }, [dialogOpenTriggerRef]);

    useEffect(() => {
        if (!showDialog) {
            return undefined;
        }
        const exitHandler = () => {
            setShowDialog(false);
        };
        Vim.defineEx('w', undefined, exitHandler);
        Vim.defineEx('q', undefined, exitHandler);
        Vim.defineEx('x', undefined, exitHandler);

        // TODO: We need to only defineEx for this particular codemirror
        // instance
        return () => {
            Vim.defineEx('w', undefined, undefined);
            Vim.defineEx('q', undefined, undefined);
            Vim.defineEx('x', undefined, undefined);
        };
    }, [showDialog]);

    const handleModalClose = useCallback(() => {
        setShowDialog(false);
    }, []);

    const handleMarkdownChange = useCallback(
        (value: string) => {
            onNoteContentUpdate(value, note?.id);
        },
        [note, onNoteContentUpdate],
    );

    return (
        <Dialog
            open={showDialog}
            onClose={handleModalClose}
            heading="Notes"
            contentClassName={styles.modalContent}
            className={styles.updateNoteDialog}
            escapeDisabled={editingMode === 'vim'}
        >
            <CodeMirror
                ref={refs}
                className={styles.codemirror}
                value={note?.content}
                height="60vh"
                extensions={editingMode === 'vim' ? extensionsWithVim : extensionsWithoutVim}
                onChange={handleMarkdownChange}
                theme={githubLight}
                autoFocus
            />
        </Dialog>
    );
}

export default AddNoteDialog;
