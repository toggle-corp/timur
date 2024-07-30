import { useId } from 'react';

import InputContainer, { Props as InputContainerProps } from '#components/InputContainer';
import RawInput, { Props as RawInputProps } from '#components/RawInput';

type InheritedProps<T> = (Omit<InputContainerProps, 'input' | 'htmlFor'> & Omit<RawInputProps<T>, 'type' | 'id'>);

export interface Props<T> extends InheritedProps<T> {
    inputElementRef?: React.RefObject<HTMLInputElement>;
    inputClassName?: string;
    type?: 'text' | 'password';
}

function TextInput<const T>(props: Props<T>) {
    const {
        actions,
        className,
        disabled,
        error,
        errorOnTooltip,
        hint,
        icons,
        inputClassName,
        inputSectionClassName,
        label,
        readOnly,
        required,
        variant,
        withAsterisk,
        type = 'text',
        ...otherInputProps
    } = props;

    const inputId = useId();

    return (
        <InputContainer
            htmlFor={inputId}
            className={className}
            actions={actions}
            disabled={disabled}
            error={error}
            errorOnTooltip={errorOnTooltip}
            hint={hint}
            icons={icons}
            inputSectionClassName={inputSectionClassName}
            label={label}
            required={required}
            readOnly={readOnly}
            variant={variant}
            withAsterisk={withAsterisk}
            input={(
                <RawInput
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...otherInputProps}
                    id={inputId}
                    required={required}
                    readOnly={readOnly}
                    disabled={disabled}
                    className={inputClassName}
                    type={type}
                />
            )}
        />
    );
}

export default TextInput;
