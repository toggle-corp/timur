import React, { useId } from 'react';

import InputContainer, { Props as InputContainerProps } from '../InputContainer';
import RawTextArea, { Props as RawTextAreaProps } from '../RawTextArea';

type InheritedProps<N> = (Omit<InputContainerProps, 'input' | 'htmlFor'> & Omit<RawTextAreaProps<N>, 'type' | 'id'>);
interface Props<T> extends InheritedProps<T> {
    inputElementRef?: React.RefObject<HTMLTextAreaElement>;
    inputClassName?: string;
}

function TextArea<const N>(props: Props<N>) {
    const {
        actions,
        className,
        disabled,
        hint,
        icons,
        inputClassName,
        label,
        labelClassName,
        readOnly,
        required,
        variant,
        inputSectionClassName,
        withAsterisk,
        onChange,
        name,
        rows = 1,
        inputElementRef,
        ...otherInputProps
    } = props;

    const inputId = useId();

    return (
        <InputContainer
            htmlFor={inputId}
            actions={actions}
            className={className}
            disabled={disabled}
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
                <RawTextArea
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...otherInputProps}
                    id={inputId}
                    readOnly={readOnly}
                    disabled={disabled}
                    className={inputClassName}
                    onChange={onChange}
                    name={name}
                    rows={rows}
                    elementRef={inputElementRef}
                />
            )}
        />
    );
}

export default TextArea;
