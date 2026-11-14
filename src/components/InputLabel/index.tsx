import { _cs } from '@togglecorp/fujs';

import styles from './styles.module.css';

interface Props {
    id?: string;
    children?: React.ReactNode;
    className?: string;
    disabled?: boolean;
    // FIXME: change prop name to withAsterisk
    required?: boolean;
}

function InputLabel(props: Props) {
    const {
        id,
        children,
        className,
        disabled,
        required,
    } = props;

    if (!children) {
        return null;
    }

    return (
        <div
            id={id}
            className={_cs(
                styles.inputLabel,
                disabled && styles.disabled,
                className,
            )}
        >
            {children}
            {required && (
                <span aria-hidden className={styles.required}>
                    *
                </span>
            )}
        </div>
    );
}

export default InputLabel;
