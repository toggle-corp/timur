import { _cs } from '@togglecorp/fujs';

import InputLabel from '#components/InputLabel';
import useBasicLayout from '#hooks/useBasicLayout';
import { type SpacingType } from '#utils/types';

import styles from './styles.module.css';

export interface Props {
    actions?: React.ReactNode;
    actionsContainerClassName?: string;
    hintContainerClassName?: string;
    iconsContainerClassName?: string;
    disabled?: boolean;
    hint?: React.ReactNode;
    icons?: React.ReactNode;
    input: React.ReactNode;
    inputSectionClassName?: string;
    label?: React.ReactNode;
    labelClassName?: string;
    readOnly?: boolean;
    required?: boolean;
    variant?: 'form' | 'general';
    withAsterisk?: boolean;
    className?: string;
    containerRef?: React.RefObject<HTMLLabelElement>;
    inputSectionRef?: React.RefObject<HTMLDivElement>;
    spacing?: SpacingType;
    htmlFor: string;
}

function InputContainer(props: Props) {
    const {
        containerRef,
        inputSectionRef,
        actions,
        className,
        disabled,
        hint,
        icons,
        input,
        inputSectionClassName,
        label,
        labelClassName,
        readOnly,
        required,
        variant = 'form',
        withAsterisk,
        actionsContainerClassName,
        hintContainerClassName,
        iconsContainerClassName,
        spacing = 'sm',
        htmlFor,
    } = props;

    const isRequired = withAsterisk ?? required;
    const {
        content: inputSectionContent,
        containerClassName: inputSectionContainerClassName,
    } = useBasicLayout({
        className: _cs(styles.inputSection, inputSectionClassName),
        icons,
        iconsContainerClassName: _cs(iconsContainerClassName, styles.iconsContainer),
        actions,
        actionsContainerClassName,
        children: input,
        childrenContainerClassName: styles.input,
        spacing,
        withoutWrap: true,
        variant: 'xs',
    });

    return (
        <label
            htmlFor={htmlFor}
            ref={containerRef}
            className={_cs(
                styles.inputContainer,
                readOnly && styles.readOnly,
                variant === 'form' && styles.form,
                variant === 'general' && styles.general,
                disabled && styles.disabled,
                className,
            )}
        >
            <InputLabel
                className={labelClassName}
                disabled={disabled}
                required={isRequired}
            >
                {label}
            </InputLabel>
            <div
                ref={inputSectionRef}
                className={inputSectionContainerClassName}
            >
                {inputSectionContent}
            </div>
            {hint && (
                <div className={_cs(styles.inputHint, hintContainerClassName)}>
                    {hint}
                </div>
            )}
        </label>
    );
}

export default InputContainer;
