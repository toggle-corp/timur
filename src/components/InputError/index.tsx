import {
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    _cs,
    isNotDefined,
} from '@togglecorp/fujs';

import Popup from '#components/Popup';

import styles from './styles.module.css';

interface Props {
    className?: string;
    children?: React.ReactNode;
    disabled?: boolean;
}

function InputError(props: Props) {
    const {
        children,
        className,
        disabled,
    } = props;

    const [hasParentRef, setHasParentRef] = useState(false);

    const parentRef = useRef<HTMLElement | undefined>();
    const dummyRef = useRef<HTMLDivElement>(null);

    useEffect(
        () => {
            if (isNotDefined(dummyRef.current)) {
                return;
            }

            const {
                current: {
                    parentElement,
                },
            } = dummyRef;

            if (isNotDefined(parentElement)) {
                return;
            }

            parentRef.current = parentElement;
            setHasParentRef(true);
        },
        [],
    );

    return (
        <>
            {!hasParentRef && (
                <div
                    className={styles.tooltipDummy}
                    ref={dummyRef}
                />
            )}
            {children && !disabled && (
                <Popup
                    className={_cs(styles.inputError, className)}
                    // pointerClassName={styles.pointer}
                    parentRef={parentRef}
                >
                    {children}
                </Popup>
            )}
        </>
    );
}

export default InputError;
