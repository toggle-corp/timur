import {
    useCallback,
    useEffect,
    useRef,
} from 'react';
import { IoCloseSharp } from 'react-icons/io5';
import { _cs } from '@togglecorp/fujs';

import Button from '#components/Button';

import styles from './styles.module.css';

export interface Props {
    className?: string;
    open?: boolean;
    onClose: (show: boolean) => void;
    children: React.ReactNode;
    heading?: React.ReactNode;
    contentClassName?: string;
}

function Dialog(props: Props) {
    const {
        className,
        open,
        onClose,
        children,
        heading,
        contentClassName,
    } = props;

    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(
        () => {
            if (open) {
                dialogRef.current?.showModal();
            } else {
                dialogRef.current?.close();
            }
        },
        [open],
    );

    const handleClose = useCallback(() => {
        onClose(false);
    }, [onClose]);

    return (
        <dialog
            ref={dialogRef}
            className={_cs(styles.dialog, open && styles.open, className)}
            onClose={handleClose}
        >
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
        </dialog>
    );
}

export default Dialog;
