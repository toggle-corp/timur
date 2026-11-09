import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    RiArrowDropDownLine,
    RiArrowDropUpLine,
} from 'react-icons/ri';
import { _cs } from '@togglecorp/fujs';

import Button, { Props as ButtonProps } from '#components/Button';
import Popup from '#components/Popup';
import DropdownMenuContext from '#contexts/dropdownMenu';

import styles from './styles.module.css';

interface Props {
    className?: string;
    popupClassName?: string;
    children?: React.ReactNode;
    label?: React.ReactNode;
    activeClassName?: string;
    icons?: React.ReactNode;
    variant?: ButtonProps<undefined>['variant'];
    actions?: React.ReactNode;
    withoutDropdownIcon?: boolean;
    title: string;
}

function DropdownMenu(props: Props) {
    const newButtonRef = useRef<HTMLButtonElement>(null);
    const {
        className,
        popupClassName,
        children,
        label,
        activeClassName,
        icons,
        variant = 'tertiary',
        actions,
        withoutDropdownIcon,
        title,
    } = props;

    const [showDropdown, setShowDropdown] = useState(false);
    const popupId = useId();

    useEffect(
        () => {
            if (showDropdown) {
                document.getElementById(popupId)
                    ?.querySelector<HTMLElement>('a[href], button:enabled')
                    ?.focus();
            }
        },
        [showDropdown, popupId],
    );

    const handleMenuClick: NonNullable<ButtonProps<undefined>['onClick']> = useCallback(
        () => {
            setShowDropdown((prevValue) => !prevValue);
        },
        [setShowDropdown],
    );

    const handleClosePopover = useCallback(
        () => {
            setShowDropdown(false);
        },
        [setShowDropdown],
    );

    const contextValue = useMemo(
        () => ({
            closePopover: handleClosePopover,
        }),
        [handleClosePopover],
    );

    const hasActions = !!actions || !withoutDropdownIcon;

    return (
        <DropdownMenuContext.Provider value={contextValue}>
            <Button
                name={undefined}
                title={title}
                // The popup holds mixed content navigated with Tab, which is the dialog pattern
                aria-haspopup="dialog"
                aria-expanded={showDropdown}
                aria-controls={popupId}
                className={_cs(
                    styles.dropdownMenu,
                    showDropdown && activeClassName,
                    className,
                )}
                elementRef={newButtonRef}
                onClick={handleMenuClick}
                variant={variant}
                actionsContainerClassName={styles.actions}
                iconsContainerClassName={styles.icons}
                childrenContainerClassName={styles.content}
                actions={hasActions ? (
                    <>
                        {actions}
                        {!withoutDropdownIcon && (showDropdown
                            ? <RiArrowDropUpLine className={styles.dropdownIcon} />
                            : <RiArrowDropDownLine className={styles.dropdownIcon} />
                        )}
                    </>
                ) : undefined}
                icons={icons}
            >
                {label}
            </Button>
            <Popup
                id={popupId}
                role="dialog"
                aria-label={title}
                parentRef={newButtonRef}
                className={_cs(styles.dropdownContent, popupClassName)}
                open={showDropdown}
                setOpen={setShowDropdown}
            >
                {children}
            </Popup>
        </DropdownMenuContext.Provider>
    );
}

export default DropdownMenu;
