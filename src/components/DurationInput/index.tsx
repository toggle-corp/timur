import {
    useCallback,
    useEffect,
    useId,
    useState,
} from 'react';
import { isDefined } from '@togglecorp/fujs';

import InputContainer, { Props as InputContainerProps } from '#components/InputContainer';
import RawInput, { Props as RawInputProps } from '#components/RawInput';
import {
    getDurationNumber,
    getDurationString,
} from '#utils/common';

type InheritedProps<T> = (Omit<InputContainerProps, 'input' | 'htmlFor'> & Omit<RawInputProps<T>, 'onChange' | 'value' | 'id'>);

export interface Props<T> extends InheritedProps<T> {
  inputElementRef?: React.RefObject<HTMLInputElement>;
  inputClassName?: string;
  value: number | undefined | null;
  onChange?: (
    value: number | undefined,
    name: T,
    e?: React.FormEvent<HTMLInputElement> | undefined,
  ) => void;
}

function DurationInput<const T>(props: Props<T>) {
    const {
        className,
        actions,
        inputSectionClassName,
        icons,
        error,
        hint,
        label,
        disabled,
        readOnly,
        inputClassName,
        value: valueFromProps,
        errorOnTooltip,
        withAsterisk,
        labelClassName,
        required,
        variant,
        onChange,
        inputElementRef,
        name,
        ...otherInputProps
    } = props;

    const inputId = useId();

    // NOTE: We want to re-calculate the tempValue onBlur so we use counter to
    // reset it
    const [counter, setCounter] = useState(0);

    const [tempValue, setTempValue] = useState<string | undefined>(
        isDefined(valueFromProps)
            ? getDurationString(valueFromProps)
            : undefined,
    );

    useEffect(() => {
        setTempValue(
            isDefined(valueFromProps)
                ? getDurationString(valueFromProps)
                : undefined,
        );
    }, [valueFromProps, counter]);

    const handleChange: RawInputProps<T>['onChange'] = useCallback((v) => {
        // TODO: Also call onChange if v is valid
        if (
            !v
            // decimal = 10.5
            || v.match(/^\d{1,2}\.\d{0,2}$/)
            // hh:mm = 10:12
            // hh:m = 10:5
            // h:mm = 1:12
            // h:m = 1:5
            || v.match(/^\d{1,2}:\d{0,2}$/)
            // :m = :5
            // :mm = :55
            || v.match(/^:\d{0,2}$/)
            // hhmm = 1012
            // hmm = 100
            // hh = 10
            // h = 1
            || v.match(/^\d{1,4}$/)
        ) {
            setTempValue(v);
        }
    }, []);

    const handleBlur = useCallback(() => {
        const newValue = getDurationNumber(tempValue);

        if (newValue !== null && onChange) {
            onChange(newValue, name);
        }

        setCounter((oldVal) => (oldVal + 1));
    }, [name, tempValue, onChange]);

    return (
        <InputContainer
            htmlFor={inputId}
            actions={actions}
            className={className}
            disabled={disabled}
            error={error}
            errorOnTooltip={errorOnTooltip}
            hint={hint}
            icons={icons}
            inputSectionClassName={inputSectionClassName}
            labelClassName={labelClassName}
            label={label}
            readOnly={readOnly}
            required={required}
            variant={variant}
            withAsterisk={withAsterisk}
            input={(
                <RawInput
                    {...otherInputProps} /* eslint-disable-line react/jsx-props-no-spreading */
                    name={name}
                    id={inputId}
                    readOnly={readOnly}
                    disabled={disabled}
                    className={inputClassName}
                    value={tempValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    type="text"
                    elementRef={inputElementRef}
                />
            )}
        />
    );
}

export default DurationInput;
