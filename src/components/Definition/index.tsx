import {
    useCallback,
    useId,
    useRef,
    useState,
} from 'react';
import { RiInformationLine } from 'react-icons/ri';

import Popup from '#components/Popup';
import RawButton from '#components/RawButton';
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
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [state, setState] = useState<State>('auto');
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);

    const shown = state === 'open' || (state === 'auto' && (hovered || focused));

    // Escape hides a definition shown on hover or focus too, and then goes no further
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || event.defaultPrevented || !shown) {
                return;
            }
            event.preventDefault();
            setState('closed');
        },
        [shown],
    );
    useKeybind(handleKeyDown, { capture: true });

    // NOTE: Escape hides the definition, so a new hover or focus shows it again
    const reopen = () => setState((value) => (value === 'closed' ? 'auto' : value));

    const label = `Definition of ${term}`;

    return (
        <div
            className={styles.definition}
            onMouseEnter={() => {
                reopen();
                setHovered(true);
            }}
            onMouseLeave={() => setHovered(false)}
        >
            <RawButton
                elementRef={triggerRef}
                className={styles.trigger}
                name={undefined}
                title={label}
                hideTitle
                aria-label={label}
                aria-describedby={id}
                aria-expanded={state === 'open'}
                onClick={() => setState((value) => (value === 'open' ? 'closed' : 'open'))}
                onFocus={() => {
                    reopen();
                    setFocused(true);
                }}
                onBlur={() => {
                    setFocused(false);
                    setState('auto');
                }}
            >
                <RiInformationLine aria-hidden />
            </RawButton>
            <Popup
                id={id}
                role="tooltip"
                variant="tooltip"
                parentRef={triggerRef}
                open={shown}
            >
                {children}
            </Popup>
        </div>
    );
}

export default Definition;
