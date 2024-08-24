import {
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    markdown,
    markdownLanguage,
} from '@codemirror/lang-markdown';
import { vim } from '@replit/codemirror-vim';
import { githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror from '@uiw/react-codemirror';

import Dialog from '#components/Dialog';
import SelectInput from '#components/SelectInput';
import {
    EditingMode,
    Note,
} from '#utils/types';

import styles from './styles.module.css';

const editingModeOptions: EditingModeOption[] = [
    { id: 'normal', title: 'Normies' },
    { id: 'vim', title: 'Vim Masterrace' },
];

const extensionsWithoutVim = [markdown({ base: markdownLanguage })];
const extensionsWithVim = [...extensionsWithoutVim, vim()];

type EditingModeOption = { id: EditingMode, title: string };
function editingModeKeySelector(item: EditingModeOption) {
    return item.id;
}
function editingModeLabelSelector(item: EditingModeOption) {
    return item.title;
}

interface Props {
    dialogOpenTriggerRef: React.MutableRefObject<(() => void) | undefined>;
    note: Note | undefined;
    onNoteContentUpdate: (value: string | undefined, id: string | undefined) => void;
    editingMode: EditingMode,
    onEditingModeChange: React.Dispatch<React.SetStateAction<EditingMode>>
}

function AddNoteDialog(props: Props) {
    const {
        dialogOpenTriggerRef,
        note,
        onNoteContentUpdate,
        editingMode,
        onEditingModeChange,
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

    const handleMarkdownChange = useCallback(
        (value: string) => {
            onNoteContentUpdate(value, note?.id);
        },
        [note, onNoteContentUpdate],
    );

    return (
        <Dialog
            open={showDialog}
            mode="right"
            onClose={handleModalClose}
            heading="Notes"
            contentClassName={styles.modalContent}
            className={styles.updateNoteDialog}
        >
            <SelectInput
                name={undefined}
                label="Mode"
                options={editingModeOptions}
                keySelector={editingModeKeySelector}
                labelSelector={editingModeLabelSelector}
                onChange={onEditingModeChange}
                value={editingMode}
                variant="general"
                nonClearable
            />
            <CodeMirror
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
