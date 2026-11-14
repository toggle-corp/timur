import { _cs } from '@togglecorp/fujs';

import styles from './styles.module.css';

type PillVariant = 'default' | 'success' | 'warning' | 'error';
type PillSize = 'sm' | 'md';

interface Props {
    className?: string;
    icon?: React.ReactNode;
    variant?: PillVariant;
    size?: PillSize;
    title?: string;
    children: React.ReactNode;
}

const variantClassNames: Record<PillVariant, string | undefined> = {
    default: undefined,
    success: styles.success,
    warning: styles.warning,
    error: styles.error,
};

function Pill(props: Props) {
    const {
        className,
        icon,
        variant = 'default',
        size = 'md',
        title,
        children,
    } = props;

    return (
        <span
            className={_cs(
                styles.pill,
                size === 'sm' && styles.small,
                variantClassNames[variant],
                className,
            )}
            title={title}
        >
            {icon && (
                <span className={styles.icon}>
                    {icon}
                </span>
            )}
            <span className={styles.label}>
                {children}
            </span>
        </span>
    );
}

export default Pill;
