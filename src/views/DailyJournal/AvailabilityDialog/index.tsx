import {
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import {
    gql,
    useMutation,
    useQuery,
} from 'urql';

import Button from '#components/Button';
import Dialog from '#components/Dialog';
import RadioInput from '#components/RadioInput';
import EnumsContext from '#contexts/enums';
import {
    AvailabilityQuery,
    AvailabilityQueryVariables,
    EnumsQuery,
    UpdateAvailabilityMutation,
    UpdateAvailabilityMutationVariables,
} from '#generated/types/graphql';
import useSetFieldValue from '#hooks/useSetFieldValue';
import { removeNull } from '#utils/nullHelper';

import styles from './styles.module.css';

type LeaveTypeOption = EnumsQuery['enums']['JournalLeaveType'][number];
function leaveTypeKeySelector(item: LeaveTypeOption) {
    return item.key;
}
function leaveTypeLabelSelector(item: LeaveTypeOption) {
    return item.label;
}
type WfhTypeOption = EnumsQuery['enums']['JournalWfhType'][number];
function wfhTypeKeySelector(item: WfhTypeOption) {
    return item.key;
}
function wfhTypeLabelSelector(item: WfhTypeOption) {
    return item.label;
}

const dateFormatter = new Intl.DateTimeFormat(
    [],
    {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
    },
);

const AVAILABILITY = gql`
    query Availability($date: Date!) {
        private {
            journal(date: $date) {
                id
                date
                leaveType
                wfhType
            }
        }
    }
`;

const UPDATE_JOURNAL = gql`
    mutation UpdateAvailability(
        $leaveType: JournalLeaveTypeEnum,
        $wfhType: JournalWorkFromHomeTypeEnum,
        $date: Date!
    ) {
        private {
            updateJournal(data: {leaveType: $leaveType, wfhType: $wfhType}, date: $date) {
                result {
                    id
                    date
                    leaveType
                    leaveTypeDisplay
                    wfhType
                    wfhTypeDisplay
                }
            }
        }
    }
`;

interface Props {
    dialogOpenTriggerRef: React.MutableRefObject<(() => void) | undefined>;
    date: string;
}

function AvailabilityDialog(props: Props) {
    const {
        dialogOpenTriggerRef,
        date,
    } = props;

    const [showDialog, setShowDialog] = useState(false);
    interface DialogState {
        wfhType?: WfhTypeOption['key'],
        leaveType?: LeaveTypeOption['key'],
    }
    const [dialogState, setDialogState] = useState<DialogState>({});
    const setFieldValue = useSetFieldValue(setDialogState);

    const { enums } = useContext(EnumsContext);

    const [
        { data, fetching: dataFetching, error: dataError },
    ] = useQuery<AvailabilityQuery, AvailabilityQueryVariables>({
        pause: !showDialog,
        query: AVAILABILITY,
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
                setDialogState({});
                return;
            }
            const journalData = removeNull(data?.private.journal);

            setDialogState({
                leaveType: journalData?.leaveType,
                wfhType: journalData?.wfhType,
            });
        },
        [
            dataFetching,
            data,
            dataError,
        ],
    );

    const [{ fetching: updateFetching }, updateAvailability] = useMutation<
        UpdateAvailabilityMutation,
        UpdateAvailabilityMutationVariables
    >(
        UPDATE_JOURNAL,
    );

    useEffect(() => {
        dialogOpenTriggerRef.current = () => {
            setShowDialog(true);
        };
    }, [dialogOpenTriggerRef]);

    const handleModalClose = useCallback(() => {
        setShowDialog(false);
    }, []);

    const handleSave = useCallback(
        async () => {
            await updateAvailability({
                date,
                leaveType: dialogState.leaveType ?? null,
                wfhType: dialogState.wfhType ?? null,
            });
            handleModalClose();
        },
        [date, dialogState, handleModalClose, updateAvailability],
    );

    // FIXME: Use memo
    const formattedDate = dateFormatter.format(new Date(date));

    // FIXME: Use memo
    const availableLeaveTypeOptions = enums?.enums.JournalLeaveType.filter(
        ({ key }) => {
            if (dialogState.wfhType === 'FIRST_HALF') {
                return key === 'SECOND_HALF';
            }
            if (dialogState.wfhType === 'SECOND_HALF') {
                return key === 'FIRST_HALF';
            }
            if (dialogState.wfhType === 'FULL') {
                // NOTE: So that we can see all options
                return true;
            }
            return true;
        },
    );

    // FIXME: Use memo
    const availableWfhTypeOptions = enums?.enums.JournalWfhType.filter(
        ({ key }) => {
            if (dialogState.leaveType === 'FIRST_HALF') {
                return key === 'SECOND_HALF';
            }
            if (dialogState.leaveType === 'SECOND_HALF') {
                return key === 'FIRST_HALF';
            }
            if (dialogState.leaveType === 'FULL') {
                // NOTE: So that we can see all options
                return true;
            }
            return true;
        },
    );

    const disabled = updateFetching || dataFetching;

    return (
        <Dialog
            size="auto"
            open={showDialog}
            onClose={handleModalClose}
            heading={`${formattedDate} availability`}
            contentClassName={styles.modalContent}
            className={styles.availabilityDialog}
        >
            <RadioInput
                name="leaveType"
                label="Leave"
                options={availableLeaveTypeOptions}
                keySelector={leaveTypeKeySelector}
                labelSelector={leaveTypeLabelSelector}
                onChange={setFieldValue}
                value={dialogState.leaveType}
                disabled={disabled || dialogState.wfhType === 'FULL'}
                clearable
            />
            <RadioInput
                name="wfhType"
                label="Work from home"
                options={availableWfhTypeOptions}
                keySelector={wfhTypeKeySelector}
                labelSelector={wfhTypeLabelSelector}
                onChange={setFieldValue}
                value={dialogState.wfhType}
                disabled={disabled || dialogState.leaveType === 'FULL'}
                clearable
            />
            <div className={styles.actions}>
                <Button
                    title="Cancel update availability"
                    name={undefined}
                    onClick={handleModalClose}
                    variant="quaternary"
                >
                    Cancel
                </Button>
                <Button
                    name={undefined}
                    title="Update availability"
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

export default AvailabilityDialog;
