import {
    useCallback,
    useState,
} from 'react';

import Button, { Props as ButtonProps } from '#components//Button';
import Dialog from '#components/Dialog';

import styles from './styles.module.css';

export interface Props<N> extends ButtonProps<N> {
    confirmHeading: React.ReactNode;
    confirmDescription: React.ReactNode;
    title: string;
}

function ConfirmButton<const N>(props: Props<N>) {
    const {
        name,
        onClick,
        confirmHeading,
        confirmDescription,
        title,
        ...buttonProps
    } = props;

    const [confirmationShown, setConfirmationShown] = useState<boolean>(false);

    const handleModalOpen = useCallback(() => {
        setConfirmationShown(true);
    }, []);

    const handleModalClose = useCallback(() => {
        setConfirmationShown(false);
    }, []);

    const handleCancelButtonClick = useCallback((_: undefined, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmationShown(false);
    }, []);

    return (
        <>
            <Button
                name={undefined}
                onClick={handleModalOpen}
                title={title}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...buttonProps}
            />
            <Dialog
                open={confirmationShown}
                mode="center"
                onClose={handleModalClose}
                heading={confirmHeading}
                contentClassName={styles.modalContent}
                className={styles.shortcutsDialog}
                size="auto"
            >
                {confirmDescription}
                <div className={styles.actions}>
                    <Button
                        title={`Cancel ${title}`}
                        name={undefined}
                        onClick={handleCancelButtonClick}
                        variant="secondary"
                    >
                        Cancel
                    </Button>
                    <Button
                        name={name}
                        title={`Confirm ${title}`}
                        onClick={onClick}
                        variant="primary"
                    >
                        Confirm
                    </Button>
                </div>
            </Dialog>
        </>
    );
}

export default ConfirmButton;
