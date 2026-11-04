import {
    useCallback,
    useId,
    useRef,
    useState,
} from 'react';
import { RiInformationLine } from 'react-icons/ri';
import { _cs } from '@togglecorp/fujs';

import RawButton from '#components/RawButton';
import { tooltipSurfaceClassName } from '#components/TooltipSurface';
import useKeybind from '#hooks/useKeybind';

import styles from './styles.module.css';

// Shown on hover and keyboard focus; a tap or click pins it, Escape hides it
type State = 'auto' | 'open' | 'closed';

interface Props {
    term: string;
    children: React.ReactNode;
}

function Definition(props: Props) {
    const {
        term,
        children,
    } = props;

    const id = useId();
    const elementRef = useRef<HTMLSpanElement>(null);
    const [state, setState] = useState<State>('auto');

    const reopen = () => setState((value) => (value === 'closed' ? 'auto' : value));

    // Escape also hides a definition shown on hover, without focus, and then goes no further
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || event.defaultPrevented) {
                return;
            }
            const shown = state === 'open'
                || (state === 'auto' && !!elementRef.current?.matches(':hover, :focus-within'));
            if (shown) {
                event.preventDefault();
                setState('closed');
            }
        },
        [state],
    );
    useKeybind(handleKeyDown, { capture: true });

    const label = `Definition of ${term}`;

    return (
        <span
            ref={elementRef}
            // NOTE: Escape hides the definition, so a new hover or focus shows it again
            onMouseEnter={reopen}
            onFocus={reopen}
            className={_cs(
                styles.definition,
                state === 'open' && styles.open,
                state === 'closed' && styles.closed,
            )}
        >
            <RawButton
                className={styles.trigger}
                name={undefined}
                title={label}
                hideTitle
                aria-label={label}
                aria-describedby={id}
                aria-expanded={state === 'open'}
                onClick={() => setState((value) => (value === 'open' ? 'closed' : 'open'))}
                onBlur={() => setState('auto')}
            >
                <RiInformationLine aria-hidden />
            </RawButton>
            <span
                className={_cs(styles.tooltip, tooltipSurfaceClassName)}
                id={id}
                role="tooltip"
            >
                {children}
            </span>
        </span>
    );
}

export default Definition;
