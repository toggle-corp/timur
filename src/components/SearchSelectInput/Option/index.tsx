import type { ReactNode } from 'react';
import { RiCheckLine } from 'react-icons/ri';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.module.css';

interface Props {
    className?: string;
    label: ReactNode;
    iconClassName?: string;
    labelClassName?: string;
    description?: ReactNode;
}

function Option(props: Props) {
    const {
        className,
        label,
        description,
        iconClassName,
        labelClassName,
    } = props;

    return (
        <div className={_cs(styles.option, className)}>
            <RiCheckLine className={_cs(styles.icon, iconClassName)} />
            <div className={_cs(styles.label, labelClassName)}>
                <div className={styles.overflowContainer}>
                    { label }
                </div>
                <div className={_cs(styles.overflowContainer, styles.description)}>
                    { description }
                </div>
            </div>
        </div>
    );
}

export default Option;
