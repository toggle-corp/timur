import React, {
    useContext,
} from 'react';
import { _cs } from '@togglecorp/fujs';

import UserContext from '#contexts/user';

import styles from './styles.module.css';

export interface Props<N> extends Omit<React.HTMLProps<HTMLButtonElement>, 'ref' | 'onClick' | 'name' | 'title'>{
    className?: string;
    elementRef?: React.Ref<HTMLButtonElement>;
    name: N;
    onClick?: (name: N, e: React.MouseEvent<HTMLButtonElement>) => void;
    type?: 'button' | 'submit' | 'reset';
    focused?: boolean;
    title: string;
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
        title,
        ...otherProps
    } = props;

    const {
        userAuth,
    } = useContext(UserContext);

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
            title={title}
            className={_cs(
                styles.rawButton,
                focused && styles.focused,
                className,
            )}
            disabled={disabled}
            onClick={onClick ? handleClick : undefined}
            data-umami-event={title}
            data-umami-event-id={userAuth?.id}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
        >
            { children }
        </button>
    );
}

export default RawButton;
