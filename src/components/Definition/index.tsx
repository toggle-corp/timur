import {
    useEffect,
    useId,
    useState,
} from 'react';
import { RiInformationLine } from 'react-icons/ri';
import { _cs } from '@togglecorp/fujs';

import { tooltipSurfaceClassName } from '#components/TooltipSurface';

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
    const [state, setState] = useState<State>('auto');

    const reopen = () => setState((value) => (value === 'closed' ? 'auto' : value));

    // Escape also hides a definition shown on hover, without focus
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setState('closed');
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <span
            // NOTE: Escape hides every definition, so a new hover or focus shows it again
            onMouseEnter={reopen}
            onFocus={reopen}
            className={_cs(
                styles.definition,
                state === 'open' && styles.open,
                state === 'closed' && styles.closed,
            )}
        >
            <button
                className={styles.trigger}
                type="button"
                aria-label={`Definition of ${term}`}
                aria-describedby={id}
                aria-expanded={state === 'open'}
                onClick={() => setState((value) => (value === 'open' ? 'closed' : 'open'))}
                onBlur={() => setState('auto')}
            >
                <RiInformationLine aria-hidden />
            </button>
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
