import {
    useCallback,
    useState,
} from 'react';
import { isDefined } from '@togglecorp/fujs';

import Button, { Props as ButtonProps } from '#components//Button';
import Dialog from '#components/Dialog';
import MonthlyCalendar from '#components/MonthlyCalendar';

import styles from './styles.module.css';

export interface Props<N> extends Omit<ButtonProps<N>, 'onClick' | 'onChange'> {
    value: string | undefined,
    onChange: (value: string | undefined) => void;
}

function CalendarInput<const N>(props: Props<N>) {
    const {
        value,
        onChange,
        ...buttonProps
    } = props;

    const [confirmationShown, setConfirmationShown] = useState<boolean>(false);

    const handleModalOpen = useCallback(
        () => {
            setConfirmationShown(true);
        },
        [],
    );

    const handleModalClose = useCallback(
        () => {
            setConfirmationShown(false);
        },
        [],
    );

    const handleDateClick = useCallback(
        (newValue: string) => {
            onChange(newValue);
            setConfirmationShown(false);
        },
        [onChange],
    );

    const today = new Date();
    const selectedDate = isDefined(value) ? new Date(value) : today;

    return (
        <>
            <Button
                onClick={handleModalOpen}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...buttonProps}
            />
            <Dialog
                open={confirmationShown}
                mode="center"
                onClose={handleModalClose}
                heading="Select date"
                contentClassName={styles.modalContent}
                className={styles.calendarDialog}
                size="auto"
            >
                <MonthlyCalendar
                    selectedDate={value}
                    initialYear={selectedDate.getFullYear()}
                    initialMonth={selectedDate.getMonth()}
                    onDateClick={handleDateClick}
                />
            </Dialog>
        </>
    );
}

export default CalendarInput;
