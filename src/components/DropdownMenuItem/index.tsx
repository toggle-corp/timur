import {
    useCallback,
    useContext,
} from 'react';
import { isDefined } from '@togglecorp/fujs';

import Button, { Props as ButtonProps } from '#components/Button';
import ConfirmButton, { Props as ConfirmButtonProps } from '#components/ConfirmButton';
import Link, { Props as LinkProps } from '#components/Link';
import DropdownMenuContext from '#contexts/dropdownMenu';

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

    const { closePopover } = useContext(DropdownMenuContext);

    const handleButtonClick = useCallback(
        (name: NAME, e: React.MouseEvent<HTMLButtonElement>) => {
            if (isDefined(onClick) && type !== 'link') {
                onClick(name, e);
            }
            // NOTE: A confirm button leaves the menu open, as it asks in a dialog of its own
            if (type === 'button') {
                closePopover();
            }
        },
        [type, onClick, closePopover],
    );

    const handleLinkClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (isDefined(onClick) && type === 'link') {
                onClick(e);
            }
            closePopover();
        },
        [type, onClick, closePopover],
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
                onClick={handleLinkClick}
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
