import React from 'react';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';

import styles from './styles.module.css';

export interface Props<N> extends Omit<React.HTMLProps<HTMLTextAreaElement>, 'ref' | 'onChange' | 'value' | 'name'> {
  className?: string;
  name: N;
  value: string | undefined | null;
  onChange: (
    value: string | undefined,
    name: N,
    e?: React.ChangeEvent<HTMLTextAreaElement> | undefined,
  ) => void;
  elementRef?: React.Ref<HTMLTextAreaElement>;
  compact?: boolean;
}

function RawTextArea<N>(props: Props<N>) {
    const {
        className,
        onChange,
        onFocus,
        elementRef,
        value,
        name,
        compact,
        ...otherProps
    } = props;

    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(
        () => {
            if (containerRef.current) {
                const splittedValue = value?.split('\n');
                const shortValue = splittedValue?.[1] ? `${splittedValue[0]}...` : value;

                containerRef.current.dataset.replicatedValue = value ?? undefined;
                containerRef.current.dataset.shortValue = shortValue ?? undefined;
            }
        },
        [value],
    );

    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const v = e?.target?.value;

        if (onChange) {
            onChange(
                v === '' ? undefined : v,
                name,
                e,
            );
        }
    }, [name, onChange]);

    const handleFocus: React.FocusEventHandler<HTMLTextAreaElement> = React.useCallback((e) => {
        const input = e.target;
        // NOTE: By default, the cursor is at the start.
        // FIXME: This introduces and error if user clicks on the first
        // character and tries to focus on the input
        if (input.selectionStart === 0 && input.selectionEnd === 0) {
            input.setSelectionRange(input.value.length, input.value.length);
        }
        if (onFocus) {
            onFocus(e);
        }
    }, [onFocus]);

    return (
        <div
            ref={containerRef}
            className={_cs(
                styles.growWrap,
                compact && styles.compact,
            )}
        >
            <textarea
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...otherProps}
                ref={elementRef}
                className={_cs(
                    styles.rawInput,
                    className,
                )}
                // FIXME: do we even need to pass name?
                name={isDefined(name) ? String(name) : undefined}
                onChange={handleChange}
                value={value ?? ''}
                onFocus={handleFocus}
                rows={1}
            />
        </div>
    );
}

export default RawTextArea;
