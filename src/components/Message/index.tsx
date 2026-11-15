import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';

import styles from './styles.module.css';

type MessageVariant = 'info' | 'warning' | 'error';

interface Props extends Pick<React.HTMLAttributes<HTMLDivElement>, 'id' | 'role'> {
    className?: string;
    variant?: MessageVariant;
    // Inline notice: a row with a tinted background and a border in the variant color
    banner?: boolean;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
    compact?: boolean;
    pending?: boolean;

    title?: React.ReactNode;
    description?: React.ReactNode;

    errored?: boolean;
    erroredTitle?: React.ReactNode;
    erroredDescription?: React.ReactNode;
}

function Message(props: Props) {
    const {
        className,
        id,
        role,
        variant,
        banner = false,
        icon,
        title,
        description,
        actions,
        compact = false,
        pending,
        errored,
        erroredTitle,
        erroredDescription,
    } = props;

    const showTitle = errored ? isDefined(erroredTitle) : isDefined(title);
    const showDescription = errored ? isDefined(erroredDescription) : isDefined(description);

    return (
        <div
            id={id}
            role={role}
            className={_cs(
                styles.message,
                variant === 'warning' && styles.warning,
                variant === 'error' && styles.errored,
                compact && styles.compact,
                banner && styles.banner,
                className,
            )}
        >
            {icon && (
                <div className={styles.icon}>
                    {icon}
                </div>
            )}
            {showTitle && (
                <div
                    className={_cs(
                        styles.title,
                        pending && !errored && styles.pending,
                    )}
                >
                    {errored ? erroredTitle : title}
                </div>
            )}
            {showDescription && (
                <div className={styles.description}>
                    {description}
                </div>
            )}
            {actions && (
                <div className={styles.actions}>
                    {actions}
                </div>
            )}
        </div>
    );
}

export default Message;
