import React, {
    useCallback,
    useId,
    useRef,
} from 'react';
import {
    IoCheckmarkDoneSharp,
    IoCloseSharp,
} from 'react-icons/io5';
import {
    _cs,
    isTruthyString,
} from '@togglecorp/fujs';

import Button from '#components/Button';
import InputContainer, { Props as InputContainerProps } from '#components/InputContainer';
import List from '#components/List';
import Popup from '#components/Popup';
import RawInput from '#components/RawInput';
import useBlurEffect from '#hooks/useBlurEffect';
import useKeyboard from '#hooks/useKeyboard';

import GenericOption, {
    ContentBaseProps,
    OptionKey,
    Props as GenericOptionProps,
} from './GenericOption';

import styles from './styles.module.css';

export type SelectInputContainerProps<
    OPTION_KEY extends OptionKey,
    NAME,
    OPTION,
    RENDER_PROPS extends ContentBaseProps,
    OMISSION extends string,
> = (
    Omit<{
        name: NAME,
        onOptionClick: (optionKey: OPTION_KEY, option: OPTION, name: NAME) => void;
        dropdownShown: boolean;
        onDropdownShownChange: (value: boolean) => void;
        focused: boolean;
        onFocusedChange: (value: boolean) => void;
        focusedKey: { key: OPTION_KEY, mouse?: boolean } | undefined;
        onFocusedKeyChange: (value: { key: OPTION_KEY, mouse?: boolean } | undefined) => void;
        searchText: string | undefined | null;
        onSearchTextChange: (search: string | undefined) => void;
        optionContainerClassName?: string;
        optionKeySelector: (datum: OPTION, index: number) => OPTION_KEY;
        optionRenderer: (
            props: Pick<RENDER_PROPS, Exclude<keyof RENDER_PROPS, keyof ContentBaseProps>>,
        ) => React.ReactNode;
        optionRendererParams: (optionKey: OPTION_KEY, option: OPTION) => RENDER_PROPS;
        totalOptionsCount?: number;
        options: OPTION[] | undefined | null;
        optionsPending?: boolean;
        optionsFiltered?: boolean;
        optionsErrored?: boolean;
        optionsPopupClassName?: string;
        persistentOptionPopup?: boolean;
        placeholder?: string;
        valueDisplay: string;
        autoFocus?: boolean;
        hasValue: boolean;
        nonClearable?: boolean;
        onClearButtonClick: () => void;
        onSelectAllButtonClick?: () => void;
        onEnterWithoutOption?: () => void;
        dropdownHidden?: boolean;
    }, OMISSION>
        & Omit<InputContainerProps, 'input' | 'htmlFor'>
    );

const emptyList: unknown[] = [];

// eslint-disable-next-line @typescript-eslint/ban-types, max-len
function SelectInputContainer<
    OPTION_KEY extends OptionKey,
    const NAME,
    OPTION extends object,
    RENDER_PROPS extends ContentBaseProps
>(
    props: SelectInputContainerProps<OPTION_KEY, NAME, OPTION, RENDER_PROPS, never>,
) {
    const {
        actions,
        actionsContainerClassName,
        className,
        disabled,
        error,
        errorContainerClassName,
        hint,
        hintContainerClassName,
        icons,
        iconsContainerClassName,
        inputSectionClassName,
        label,
        labelClassName,
        name,
        onOptionClick,
        searchText,
        onSearchTextChange,
        optionContainerClassName,
        optionKeySelector,
        optionRenderer,
        optionRendererParams,
        options: optionsFromProps,
        optionsPopupClassName,
        persistentOptionPopup,
        readOnly,
        placeholder,
        valueDisplay = '',
        nonClearable,
        onClearButtonClick,
        onSelectAllButtonClick,
        optionsPending = false,
        optionsFiltered = false,
        optionsErrored = false,
        focused,
        focusedKey,
        onFocusedKeyChange,
        onFocusedChange,
        dropdownShown,
        onDropdownShownChange,
        totalOptionsCount = 0,
        hasValue,
        autoFocus,
        onEnterWithoutOption,
        withAsterisk,
        required,
        variant,
        errorOnTooltip,
        dropdownHidden,
    } = props;

    const inputId = useId();
    const options = optionsFromProps ?? (emptyList as OPTION[]);

    const containerRef = useRef<HTMLLabelElement>(null);
    const inputSectionRef = useRef<HTMLDivElement>(null);
    const inputElementRef = useRef<HTMLInputElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    const handleSearchInputChange = useCallback(
        (value: string | undefined) => {
            if (!dropdownShown) {
                onDropdownShownChange(true);
            }
            onSearchTextChange(value);
            onFocusedKeyChange(undefined);
        },
        [
            dropdownShown,
            onDropdownShownChange,
            onSearchTextChange,
            onFocusedKeyChange,
        ],
    );

    /*
    const handleToggleDropdown: NonNullable<ButtonProps<undefined>['onClick']> = useCallback(
        (_, e) => {
            e.stopPropagation();
            onDropdownShownChange(!dropdownShown);
        },
        [dropdownShown, onDropdownShownChange],
    );
    */

    const handleShowDropdown = useCallback(
        () => {
            // FIXME: this is not atomic. Call only once
            if (!dropdownShown) {
                onDropdownShownChange(true);
            }
        },
        [
            dropdownShown,
            onDropdownShownChange,
        ],
    );

    const handleHideDropdown = useCallback(
        () => {
            onDropdownShownChange(false);
        },
        [onDropdownShownChange],
    );

    const handleSearchInputClick = useCallback(
        () => {
            if (readOnly) {
                return;
            }
            handleShowDropdown();
        },
        [readOnly, handleShowDropdown],
    );

    const handlePopupBlur = useCallback(
        (clickedInside: boolean, clickedInParent: boolean) => {
            const isClickedWithin = clickedInside || clickedInParent;
            if (!isClickedWithin) {
                handleHideDropdown();
            } else if (persistentOptionPopup && inputElementRef.current) {
                inputElementRef.current.focus();
            }
        },
        [handleHideDropdown, persistentOptionPopup],
    );

    const handleOptionClick = useCallback(
        (valueKey: OPTION_KEY, value: OPTION) => {
            onOptionClick(valueKey, value, name);
            if (!persistentOptionPopup) {
                handleHideDropdown();
            }
        },
        [onOptionClick, handleHideDropdown, persistentOptionPopup, name],
    );

    const optionListRendererParams = useCallback(
        (key: OPTION_KEY, option: OPTION) => ({
            contentRendererParam: optionRendererParams,
            option,
            optionKey: key,
            focusedKey,
            contentRenderer: optionRenderer,
            onClick: handleOptionClick,
            onFocus: onFocusedKeyChange,
            optionContainerClassName: _cs(optionContainerClassName, styles.listItem),
        }),
        [
            focusedKey,
            handleOptionClick,
            onFocusedKeyChange,
            optionContainerClassName,
            optionRenderer,
            optionRendererParams,
        ],
    );

    useBlurEffect(
        dropdownShown,
        handlePopupBlur,
        popupRef,
        containerRef,
    );

    const handleKeyDown = useKeyboard(
        focusedKey,
        optionKeySelector,
        options,
        dropdownShown,

        onFocusedKeyChange,
        handleHideDropdown,
        handleShowDropdown,
        handleOptionClick,
        onEnterWithoutOption,
    );

    const optionsCount = options.length;

    const infoMessage = totalOptionsCount - optionsCount > 0
        ? `and ${totalOptionsCount - optionsCount} more`
        : undefined;

    const dropdownShownActual = dropdownShown && !dropdownHidden;

    /*
    const color = isTruthyString(valueDisplay) ? stringToColor(valueDisplay) : undefined;

    useEffect(() => {
        const input = document.getElementById(inputId);
        function modifier(a: number, b: number) {
            return (1 - b) ** 0.1 / a;
        }

        if (isDefined(input)) {
            if (isDefined(color)) {
                input.style.borderColor = color;
                input.style.backgroundColor = color;
                input.style.backgroundColor = modifyHexSL(
                    color,
                    (s) => (1 - s) / s,
                    (l, s) => modifier(l, s),
                );
                input.style.color = modifyHexSL(
                    color,
                    (s) => 1 / (1 - s),
                    (l, s) => ((l * modifier(l, s)) > 0.5 ? 0.33 : (1.33 / l)),
                );
            } else {
                input.style.backgroundColor = 'unset';
                input.style.color = 'inherit';
            }
        }
    }, [color, inputId]);
    */

    return (
        <>
            <InputContainer
                htmlFor={inputId}
                actionsContainerClassName={actionsContainerClassName}
                className={_cs(styles.selectInputContainer, className)}
                containerRef={containerRef}
                disabled={disabled}
                errorContainerClassName={errorContainerClassName}
                error={error}
                errorOnTooltip={errorOnTooltip}
                hintContainerClassName={hintContainerClassName}
                hint={hint}
                iconsContainerClassName={iconsContainerClassName}
                icons={icons}
                inputSectionClassName={inputSectionClassName}
                inputSectionRef={inputSectionRef}
                labelClassName={labelClassName}
                label={label}
                readOnly={readOnly}
                required={required}
                variant={variant}
                withAsterisk={withAsterisk}
                actions={(
                    <>
                        {actions}
                        {!readOnly && onSelectAllButtonClick && (
                            <Button
                                onClick={onSelectAllButtonClick}
                                disabled={disabled}
                                variant="tertiary"
                                name={undefined}
                                title="Select all options"
                            >
                                <IoCheckmarkDoneSharp className={styles.icon} />
                            </Button>
                        )}
                        {!readOnly && !nonClearable && hasValue && (
                            <Button
                                onClick={onClearButtonClick}
                                disabled={disabled}
                                variant="tertiary"
                                name={undefined}
                                title="Clear all options"
                            >
                                <IoCloseSharp className={styles.icon} />
                            </Button>
                        )}
                        {/* !readOnly && (
                            <Button
                                onClick={handleToggleDropdown}
                                variant="tertiary"
                                name={undefined}
                                title={dropdownShownActual
                                    ? 'Close dropdown'
                                    : 'Open dropdown'}
                            >
                                {dropdownShownActual
                                    ? <IoCaretUpSharp className={styles.icon} />
                                    : <IoCaretDownSharp className={styles.icon} />}
                            </Button>
                        ) */}
                    </>
                )}
                input={(
                    <RawInput
                        className={styles.input}
                        id={inputId}
                        name={name}
                        elementRef={inputElementRef}
                        readOnly={readOnly}
                        disabled={disabled}
                        value={(dropdownShown || focused) ? searchText : valueDisplay}
                        onChange={handleSearchInputChange}
                        onClick={handleSearchInputClick}
                        onFocus={() => onFocusedChange(true)}
                        onBlur={() => onFocusedChange(false)}
                        placeholder={isTruthyString(valueDisplay) ? valueDisplay : placeholder}
                        autoComplete="off"
                        onKeyDown={handleKeyDown}
                        autoFocus={autoFocus}
                    />
                )}
            />
            {dropdownShownActual && (
                <Popup
                    elementRef={popupRef}
                    parentRef={inputSectionRef}
                    className={_cs(optionsPopupClassName, styles.popup)}
                >
                    <List<OPTION, OPTION_KEY, GenericOptionProps<RENDER_PROPS, OPTION_KEY, OPTION>>
                        className={styles.list}
                        data={options}
                        keySelector={optionKeySelector}
                        renderer={GenericOption}
                        rendererParams={optionListRendererParams}
                        errored={optionsErrored}
                        filtered={optionsFiltered}
                        pending={optionsPending}
                        pendingMessage="Fetching options..."
                        emptyMessage="No option available"
                        filteredEmptyMessage="No option available for the search"
                        errorMessage="Failed to load options"
                        compact
                    />
                    {!optionsPending && !optionsErrored && !!infoMessage && (
                        <div className={styles.infoMessage}>
                            {infoMessage}
                        </div>
                    )}
                </Popup>
            )}
        </>
    );
}

export default SelectInputContainer;
