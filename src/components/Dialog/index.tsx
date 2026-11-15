import {
    RefObject,
    useCallback,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
} from 'react';
import { RiCloseLine } from 'react-icons/ri';
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
    closeOnOutsideClick?: boolean;
    // Hides the close button and ignores Esc and outside clicks
    persistent?: boolean;

    focusElementRef?: RefObject<HTMLElement | null>;
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
        closeOnOutsideClick,
        persistent,
        size,
    } = props;

    const dialogRef = useRef<HTMLDialogElement>(null);
    const headingId = useId();

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
        () => ({ dialogRef }),
        [],
    );

    const handleCancel: React.ReactEventHandler<HTMLDialogElement> = useCallback((e) => {
        if (escapeDisabled || persistent) {
            e.preventDefault();
        }
    }, [escapeDisabled, persistent]);

    const handleClose = useCallback(() => {
        // NOTE: Browsers skip the cancel event on a repeated Esc without user
        // activation in between, so the dialog can close while still open here
        if (persistent && open) {
            dialogRef.current?.showModal();
            return;
        }
        onClose(false);
    }, [onClose, persistent, open]);

    const handleCloseButtonClick = useCallback((_: undefined, e: React.MouseEvent) => {
        e.stopPropagation();
        onClose(false);
    }, [onClose]);

    const handleDialogClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
        // NOTE: When user clicks on the backdrop, the e.target will the the dialog
        // else, e.target will be the children of dialog component
        if (closeOnOutsideClick && !persistent && e.target === dialogRef.current) {
            onClose(false);
        }
    }, [closeOnOutsideClick, persistent, onClose]);

    return (
        <DialogContext.Provider
            value={contextValue}
        >
            {/* eslint-disable-next-line max-len */}
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
            <dialog
                ref={dialogRef}
                aria-labelledby={headingId}
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
                onClick={handleDialogClick}
            >
                {open && (
                    <>
                        <header className={styles.header}>
                            <h4
                                id={headingId}
                                className={styles.heading}
                            >
                                {heading}
                            </h4>
                            {!persistent && (
                                <Button
                                    className={styles.closeButton}
                                    name={undefined}
                                    onClick={handleCloseButtonClick}
                                    title="Close dialog"
                                    variant="transparent"
                                >
                                    <RiCloseLine />
                                </Button>
                            )}
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
