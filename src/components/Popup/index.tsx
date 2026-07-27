import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
} from 'react';
import {
    _cs,
    randomString,
} from '@togglecorp/fujs';

import styles from './styles.module.css';

interface Props {
    className?: string;
    children?: React.ReactNode;
    parentRef: React.RefObject<HTMLElement | null>;
    open?: boolean;
    setOpen?: (isOpen: boolean) => void;
}

function Popup(props: Props) {
    const {
        className,
        children,
        parentRef,
        open,
        setOpen,
    } = props;

    const anchorName = useMemo(() => `anchor_${randomString(8)}`, []);

    const popoverRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (parentRef.current) {
            parentRef.current.style.setProperty('anchor-name', `--${anchorName}`);
        }
    }, [anchorName, parentRef]);

    useEffect(() => {
        const popover = popoverRef.current;
        if (!popover) {
            return;
        }

        const isOpen = popover.matches(':popover-open');
        if (open && !isOpen) {
            popover.showPopover();
        } else if (!open && isOpen) {
            popover.hidePopover();
        }
    }, [open]);

    useLayoutEffect(() => {
        const popover = popoverRef.current;
        if (!popover) {
            return undefined;
        }

        const handler = (event: Event) => {
            const { newState } = event as (Event & { newState: string });
            const newValue = newState === 'open';
            if (setOpen) {
                setOpen(newValue);
            }
        };

        popover.addEventListener('toggle', handler);
        return () => {
            popover.removeEventListener('toggle', handler);
        };
    }, [setOpen]);

    return (
        <div
            popover="auto"
            ref={popoverRef}
            style={{
                positionAnchor: `--${anchorName}`,
            }}
            className={_cs(
                styles.popover,
                className,
            )}
        >
            {children}
        </div>
    );
}

export default Popup;
