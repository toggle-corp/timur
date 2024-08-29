import React from 'react';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';

import styles from './styles.module.css';

export interface Props<NAME> extends Omit<React.HTMLProps<HTMLInputElement>, 'ref' | 'onChange' | 'value' | 'name' | 'label'> {
    className?: string;
    name: NAME;
    value: string | undefined | null;
    onChange: (
        value: string | undefined,
        name: NAME,
        e?: React.FormEvent<HTMLInputElement> | undefined,
    ) => void;
    elementRef?: React.RefObject<HTMLInputElement>;
}

function RawInput<const N>(props: Props<N>) {
    const {
        className,
        onChange,
        onFocus,
        elementRef,
        value,
        name,
        placeholder,
        style,
        ...otherProps
    } = props;

    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(
        () => {
            if (containerRef.current) {
                const val = value || placeholder || '';
                containerRef.current.dataset.replicatedValue = val;
            }
        },
        [value, placeholder],
    );

    const handleChange = React.useCallback((e: React.FormEvent<HTMLInputElement>) => {
        const v = e.currentTarget.value;

        if (onChange) {
            onChange(
                v === '' ? undefined : v,
                name,
                e,
            );
        }
    }, [name, onChange]);

    const handleFocus: React.FocusEventHandler<HTMLInputElement> = React.useCallback((e) => {
        const input = e.target;
        // NOTE: start and end are equal if input is focused by mouse click
        if (input.selectionStart !== input.selectionEnd) {
            input.setSelectionRange(input.value.length, input.value.length);
        }
        if (onFocus) {
            onFocus(e);
        }
    }, [onFocus]);

    return (
        <div
            ref={containerRef}
            style={style}
            className={_cs(
                styles.growWrap,
                className,
            )}
        >
            <input
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...otherProps}
                placeholder={placeholder}
                ref={elementRef}
                className={_cs(
                    styles.rawInput,
                )}
                // FIXME: do we even need to pass name?
                name={isDefined(name) ? String(name) : undefined}
                onChange={handleChange}
                value={value ?? ''}
                onFocus={handleFocus}
                size={1}
            />
        </div>
    );
}

export default RawInput;
