import {
    RefObject,
    useCallback,
    useLayoutEffect,
    useMemo,
    useRef,
} from 'react';
import { IoCloseSharp } from 'react-icons/io5';
import { _cs } from '@togglecorp/fujs';

import Button from '#components/Button';
import DialogContext from '#contexts/dialog';

import styles from './styles.module.css';

export interface Props {
    className?: string;
    open?: boolean;
    onClose: (show: boolean) => void;
    children: React.ReactNode;
    heading?: React.ReactNode;
    contentClassName?: string;

    mode?: 'right' | 'center';
    size?: 'auto';

    focusElementRef?: RefObject<HTMLElement>;
}

function Dialog(props: Props) {
    const {
        className,
        open,
        onClose,
        children,
        heading,
        contentClassName,
        focusElementRef,
        mode = 'center',
        size,
    } = props;

    const dialogRef = useRef<HTMLDialogElement>(null);

    useLayoutEffect(
        () => {
            if (open) {
                dialogRef.current?.showModal();
                focusElementRef?.current?.focus();
            } else {
                dialogRef.current?.close();
            }
        },
        [open, focusElementRef],
    );

    const contextValue = useMemo(
        () => ({
            dialogRef,
        }),
        [],
    );

    const handleClose = useCallback(() => {
        onClose(false);
    }, [onClose]);

    return (
        <DialogContext.Provider
            value={contextValue}
        >
            <dialog
                ref={dialogRef}
                className={_cs(
                    className,
                    styles.dialog,
                    open && styles.open,
                    mode === 'right' && styles.rightMode,
                    mode === 'center' && styles.centerMode,
                    size === 'auto' && styles.autoSize,
                )}
                onClose={handleClose}
            >
                {open && (
                    <>
                        <header className={styles.header}>
                            <h2 className={styles.heading}>
                                {heading}
                            </h2>
                            <Button
                                className={styles.closeButton}
                                name={false}
                                onClick={onClose}
                                title="Close"
                                variant="tertiary"
                            >
                                <IoCloseSharp />
                            </Button>
                        </header>
                        <div className={_cs(styles.content, contentClassName)}>
                            {children}
                        </div>
                    </>
                )}
            </dialog>
        </DialogContext.Provider>
    );
}

export default Dialog;
