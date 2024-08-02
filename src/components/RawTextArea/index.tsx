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
}

function RawTextArea<N>(props: Props<N>) {
    const {
        className,
        onChange,
        onFocus,
        elementRef,
        value,
        name,
        ...otherProps
    } = props;

    const parentRef = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(
        () => {
            if (parentRef.current) {
                parentRef.current.dataset.replicatedValue = value ?? undefined;
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
        input.setSelectionRange(input.value.length, input.value.length);
        if (onFocus) {
            onFocus(e);
        }
    }, [onFocus]);

    return (
        <div
            ref={parentRef}
            className={styles.growWrap}
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
