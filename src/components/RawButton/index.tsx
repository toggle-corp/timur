import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.module.css';

export interface Props<N> extends Omit<React.HTMLProps<HTMLButtonElement>, 'ref' | 'onClick' | 'name'>{
    className?: string;
    elementRef?: React.Ref<HTMLButtonElement>;
    name: N;
    onClick?: (name: N, e: React.MouseEvent<HTMLButtonElement>) => void;
    type?: 'button' | 'submit' | 'reset';
    focused?: boolean;
}

function RawButton<const N>(props: Props<N>) {
    const {
        children,
        className,
        disabled,
        elementRef,
        name,
        onClick,
        focused,
        type = 'button',
        ...otherProps
    } = props;

    const handleClick = React.useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            if (onClick) {
                onClick(name, e);
            }
        },
        [onClick, name],
    );

    return (
        <button
            ref={elementRef}
            name={typeof name === 'string' ? name : undefined}
            // eslint-disable-next-line react/button-has-type
            type={type}
            className={_cs(
                styles.rawButton,
                focused && styles.focused,
                className,
            )}
            disabled={disabled}
            onClick={onClick ? handleClick : undefined}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
        >
            { children }
        </button>
    );
}

export default RawButton;
