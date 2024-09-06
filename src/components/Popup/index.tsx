import { useContext } from 'react';
import { _cs } from '@togglecorp/fujs';

import Portal from '#components/Portal';
import DialogContext from '#contexts/dialog';
import useFloatPlacement from '#hooks/useFloatPlacement';

import styles from './styles.module.css';

interface Props {
    className?: string;
    elementRef?: React.RefObject<HTMLDivElement>;
    parentRef: React.RefObject<HTMLElement | undefined>;
    children?: React.ReactNode;
    preferredWidth?: number;
}

function Popup(props: Props) {
    const {
        parentRef,
        elementRef,
        children,
        className,
        preferredWidth,
    } = props;

    const placements = useFloatPlacement(parentRef, preferredWidth);

    const {
        dialogRef,
    } = useContext(DialogContext);

    if (!placements) {
        return null;
    }

    const {
        content,
        width,
        orientation,
    } = placements;

    return (
        <Portal
            container={dialogRef}
        >
            <div
                ref={elementRef}
                style={{
                    ...content,
                    width,
                }}
                className={_cs(
                    styles.popup,
                    orientation.vertical === 'bottom' && styles.topOrientation,
                    className,
                )}
            >
                {children}
            </div>
        </Portal>
    );
}

export default Popup;
