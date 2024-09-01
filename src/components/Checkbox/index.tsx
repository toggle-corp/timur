import {
    useCallback,
    useId,
} from 'react';
import { _cs } from '@togglecorp/fujs';

import DefaultCheckmark, { CheckmarkProps } from './Checkmark';

import styles from './styles.module.css';

// FIXME extend with input prop
interface Props<NAME> {
    className?: string;
    checkmark?: (p: CheckmarkProps) => React.ReactElement;
    checkmarkClassName?: string;
    disabled?: boolean;
    indeterminate?: boolean;
    inputClassName?: string;
    invertedLogic?: boolean;
    label?: React.ReactNode;
    labelContainerClassName?: string;
    name: NAME;
    onChange: (value: boolean, name: NAME) => void;
    readOnly?: boolean;
    tooltip?: string;
    value: boolean | undefined | null;
    description?: React.ReactNode;
}

function Checkbox<const NAME>(props: Props<NAME>) {
    const {
        className: classNameFromProps,
        checkmark: Checkmark = DefaultCheckmark,
        checkmarkClassName,
        disabled,
        indeterminate,
        inputClassName,
        invertedLogic = false,
        label,
        labelContainerClassName,
        name,
        onChange,
        readOnly,
        tooltip,
        value,
        description,
        ...otherProps
    } = props;

    const inputId = useId();

    const handleChange = useCallback(
        (e: React.FormEvent<HTMLInputElement>) => {
            const v = e.currentTarget.checked;
            onChange(
                invertedLogic ? !v : v,
                name,
            );
        },
        [name, onChange, invertedLogic],
    );

    const checked = invertedLogic ? !value : value;

    const className = _cs(
        styles.checkbox,
        classNameFromProps,
        !indeterminate && checked && styles.checked,
        disabled && styles.disabledCheckbox,
        readOnly && styles.readOnly,
    );

    return (
        <label
            className={className}
            title={tooltip}
            htmlFor={inputId}
        >
            <input
                id={inputId}
                onChange={handleChange}
                className={_cs(styles.input, inputClassName)}
                type="checkbox"
                checked={checked ?? false}
                disabled={disabled || readOnly}
                readOnly={readOnly}
                {...otherProps} // eslint-disable-line react/jsx-props-no-spreading
            />
            <Checkmark
                className={_cs(styles.checkmark, checkmarkClassName)}
                value={checked ?? false}
                indeterminate={indeterminate}
                aria-hidden="true"
            />
            {(label || description) && (
                <div className={styles.content}>
                    {label && (
                        <div className={labelContainerClassName}>
                            {label}
                        </div>
                    )}
                    {description && (
                        <div className={styles.description}>
                            {description}
                        </div>
                    )}
                </div>
            )}
        </label>
    );
}

export default Checkbox;
