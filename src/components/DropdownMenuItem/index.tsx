import { useCallback } from 'react';
import { isDefined } from '@togglecorp/fujs';

import Button, { Props as ButtonProps } from '#components/Button';
import ConfirmButton, { Props as ConfirmButtonProps } from '#components/ConfirmButton';
import Link, { Props as LinkProps } from '#components/Link';

type ButtonTypeProps<NAME> = Omit<ButtonProps<NAME>, 'type'> & {
    type: 'button';
}

type LinkTypeProps = LinkProps & {
    type: 'link';
}

type ConfirmButtonTypeProps<NAME> = Omit<ConfirmButtonProps<NAME>, 'type'> & {
    type: 'confirm-button',
}

type Props<N> = ButtonTypeProps<N> | LinkTypeProps | ConfirmButtonTypeProps<N>;

function DropdownMenuItem<NAME>(props: Props<NAME>) {
    const {
        type,
        onClick,
    } = props;

    const handleButtonClick = useCallback(
        (name: NAME, e: React.MouseEvent<HTMLButtonElement>) => {
            if (isDefined(onClick) && type !== 'link') {
                onClick(name, e);
            }
        },
        [type, onClick],
    );

    if (type === 'link') {
        const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            type: _,
            variant = 'dropdown-item',
            ...otherProps
        } = props;

        return (
            <Link
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...otherProps}
                variant={variant}
            />
        );
    }

    if (type === 'button') {
        const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            type: _,
            variant = 'dropdown-item',
            ...otherProps
        } = props;

        return (
            <Button
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...otherProps}
                variant={variant}
                onClick={handleButtonClick}
            />
        );
    }

    if (type === 'confirm-button') {
        const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            type: _,
            variant = 'dropdown-item',
            ...otherProps
        } = props;

        return (
            <ConfirmButton
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...otherProps}
                variant={variant}
                onClick={handleButtonClick}
            />
        );
    }

    return null;
}

export default DropdownMenuItem;
