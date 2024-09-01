import {
    useCallback,
    useEffect,
    useLayoutEffect,
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
import {
    gql,
    useMutation,
    useQuery,
} from 'urql';

import Button from '#components/Button';
import Dialog from '#components/Dialog';
import {
    NoteQuery,
    NoteQueryVariables,
    UpdateNoteMutation,
    UpdateNoteMutationVariables,
} from '#generated/types/graphql';
import { removeNull } from '#utils/nullHelper';
import { EditingMode } from '#utils/types';

import styles from './styles.module.css';

const extensionsWithoutVim = [markdown({ base: markdownLanguage })];
const extensionsWithVim = [...extensionsWithoutVim, vim()];

const dateFormatter = new Intl.DateTimeFormat(
    [],
    {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
    },
);

const NOTE = gql`
    query Note($date: Date!) {
        private {
            journal(date: $date) {
                id
                date
                journalText
            }
        }
    }
`;

const UPDATE_NOTE = gql`
    mutation UpdateNote(
        $journalText: String!,
        $date: Date!
    ) {
        private {
            updateJournal(data: { journalText: $journalText }, date: $date) {
                result {
                    id
                    date
                    journalText
                }
            }
        }
    }
`;

interface Props {
    dialogOpenTriggerRef: React.MutableRefObject<(() => void) | undefined>;
    editingMode: EditingMode,
    date: string,
}

function AddNoteDialog(props: Props) {
    const {
        dialogOpenTriggerRef,
        editingMode,
        date,
    } = props;

    const refs = useRef<ReactCodeMirrorRef>({});

    const [showDialog, setShowDialog] = useState(false);
    const [dialogState, setDialogState] = useState<string | undefined>(undefined);

    const [
        { data, fetching: dataFetching, error: dataError },
    ] = useQuery<NoteQuery, NoteQueryVariables>({
        pause: !showDialog,
        query: NOTE,
        variables: { date },
    });

    const prevCountRef = useRef<boolean>(dataFetching);
    useLayoutEffect(
        () => {
            const previousFetching = prevCountRef.current;
            prevCountRef.current = dataFetching;

            if (dataFetching === previousFetching) {
                return;
            }
            if (dataFetching) {
                return;
            }
            if (dataError) {
                setDialogState(undefined);
                return;
            }
            const journalData = removeNull(data?.private.journal);

            setDialogState(journalData?.journalText);
        },
        [
            dataFetching,
            data,
            dataError,
        ],
    );

    const [{ fetching: updateFetching }, updateNote] = useMutation<
        UpdateNoteMutation,
        UpdateNoteMutationVariables
    >(
        UPDATE_NOTE,
    );

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
            setDialogState(value);
        },
        [],
    );

    const handleSave = useCallback(
        async () => {
            await updateNote({
                date,
                journalText: dialogState ?? '',
            });
        },
        [date, dialogState],
    );

    useEffect(() => {
        if (!showDialog) {
            return undefined;
        }
        const exitHandler = () => {
            setShowDialog(false);
        };
        const saveHandler = async () => {
            await handleSave();
        };
        const saveAndQuitHandler = async () => {
            await handleSave();
            setShowDialog(false);
        };
        Vim.defineEx('w', undefined, saveHandler);
        Vim.defineEx('q', undefined, exitHandler);
        Vim.defineEx('x', undefined, saveAndQuitHandler);

        // TODO: We need to only defineEx for this particular codemirror
        // instance
        return () => {
            Vim.defineEx('w', undefined, undefined);
            Vim.defineEx('q', undefined, undefined);
            Vim.defineEx('x', undefined, undefined);
        };
    }, [showDialog, handleSave]);

    const formattedDate = dateFormatter.format(new Date(date));
    const disabled = updateFetching || dataFetching;

    return (
        <Dialog
            open={showDialog}
            onClose={handleModalClose}
            heading={`${formattedDate} notes`}
            contentClassName={styles.modalContent}
            className={styles.updateNoteDialog}
            escapeDisabled={editingMode === 'vim'}
            size="auto-height"
        >
            <CodeMirror
                ref={refs}
                className={styles.codemirror}
                value={dialogState}
                height="50vh"
                extensions={editingMode === 'vim' ? extensionsWithVim : extensionsWithoutVim}
                onChange={handleMarkdownChange}
                theme={githubLight}
                autoFocus
            />
            <div className={styles.actions}>
                <Button
                    title="Close note dialog"
                    name={undefined}
                    onClick={handleModalClose}
                    variant="quaternary"
                >
                    Close
                </Button>
                <Button
                    name={undefined}
                    title="Update note"
                    onClick={handleSave}
                    variant="primary"
                    disabled={disabled}
                >
                    Save
                </Button>
            </div>
        </Dialog>
    );
}

export default AddNoteDialog;
