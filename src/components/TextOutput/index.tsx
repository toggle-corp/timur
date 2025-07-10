import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.module.css';

interface Props {
    className?: string;
    label?: React.ReactNode;
    labelContainerClassName?: string;
    description?: React.ReactNode;
    descriptionContainerClassName?: string;
    valueContainerClassName?: string;
    hideLabelColon?: boolean;
    block?: boolean;
    value?: React.ReactNode;
}

function TextOutput(props: Props) {
    const {
        className,
        label,
        labelContainerClassName,
        valueContainerClassName,
        description,
        descriptionContainerClassName,
        hideLabelColon,
        block,
        value,
    } = props;

    return (
        <div
            className={_cs(
                styles.textOutput,
                !hideLabelColon && styles.withLabelColon,
                // NOTE:
                // styles.blok is supposed to be styles.block
                // but we encountered a strange behavior
                block && styles.blok,
                className,
            )}
        >
            {label && (
                <div className={_cs(styles.label, labelContainerClassName)}>
                    {label}
                </div>
            )}
            <div className={_cs(styles.value, valueContainerClassName)}>
                {value}
            </div>
            {description && (
                <div className={_cs(styles.description, descriptionContainerClassName)}>
                    {description}
                </div>
            )}
        </div>
    );
}

export default TextOutput;
