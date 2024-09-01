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

interface Props {
    className?: string;
    open?: boolean;
    onClose: (show: boolean) => void;
    children: React.ReactNode;
    heading?: React.ReactNode;
    contentClassName?: string;

    mode?: 'right' | 'center';
    size?: 'auto-height' | 'auto';
    escapeDisabled?: boolean;

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
        escapeDisabled,
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

    const handleCancel: React.ReactEventHandler<HTMLDialogElement> = useCallback((e) => {
        if (escapeDisabled) {
            e.preventDefault();
        }
    }, [escapeDisabled]);

    const handleClose = useCallback(() => {
        onClose(false);
    }, [onClose]);

    const handleCloseButtonClick = useCallback((_: undefined, e: React.MouseEvent) => {
        e.stopPropagation();
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
                    size === 'auto-height' && styles.autoHeight,
                )}
                onCancel={handleCancel}
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
                                name={undefined}
                                onClick={handleCloseButtonClick}
                                title="Close dialog"
                                variant="transparent"
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
