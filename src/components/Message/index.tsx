import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';

import styles from './styles.module.css';

type MessageVariant = 'info' | 'error';

interface Props {
    className?: string;
    variant?: MessageVariant;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
    compact?: boolean;

    title?: React.ReactNode;
    description?: React.ReactNode;

    errored?: boolean;
    erroredTitle?: React.ReactNode;
    erroredDescription?: React.ReactNode;
}

function Message(props: Props) {
    const {
        className,
        variant,
        icon,
        title,
        description,
        actions,
        compact = false,
        errored,
        erroredTitle,
        erroredDescription,
    } = props;

    const showTitle = errored ? isDefined(erroredTitle) : isDefined(title);
    const showDescription = errored ? isDefined(erroredDescription) : isDefined(description);

    return (
        <div
            className={_cs(
                styles.message,
                variant === 'error' && styles.errored,
                compact && styles.compact,
                className,
            )}
        >
            {icon && (
                <div className={styles.icon}>
                    {/* pending && <Spinner className={styles.spinner} /> */}
                    {icon}
                </div>
            )}
            {showTitle && (
                <div className={styles.title}>
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
