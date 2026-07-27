import { _cs } from '@togglecorp/fujs';

import styles from './styles.module.css';

interface Props {
    className?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}

function Pill(props: Props) {
    const {
        className,
        icon,
        children,
    } = props;

    return (
        <span className={_cs(styles.pill, className)}>
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
