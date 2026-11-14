import { _cs } from '@togglecorp/fujs';

import styles from './styles.module.css';

interface Props {
    className?: string;
    // Shows the text as a validation error
    error?: boolean;
    children: React.ReactNode;
}

// Help or error text below an input
function InputHint(props: Props) {
    const {
        className,
        error,
        children,
    } = props;

    return (
        <div
            className={_cs(
                styles.inputHint,
                error && styles.error,
                className,
            )}
        >
            {children}
        </div>
    );
}

export default InputHint;
