import {
    useCallback,
    useContext,
} from 'react';
import {
    RiAdminLine,
    RiLogoutBoxLine,
    RiSettings4Line,
} from 'react-icons/ri';
import {
    _cs,
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    gql,
    useMutation,
} from 'urql';

import DisplayPicture from '#components/DisplayPicture';
import DropdownMenu from '#components/DropdownMenu';
import DropdownMenuItem from '#components/DropdownMenuItem';
import Link from '#components/Link';
import NavbarContext from '#contexts/navbar';
import UserContext from '#contexts/user';
import {
    LogoutMutation,
    LogoutMutationVariables,
} from '#generated/types/graphql';

import timurLogo from '../../App/icon.svg';

import styles from './styles.module.css';

const LOGOUT_MUTATION = gql`
    mutation Logout {
        public {
            logout {
                ok
                errors
            }
        }
    }
`;

interface Props {
    className?: string;
}

function Navbar(props: Props) {
    const { className } = props;
    const {
        userAuth,
        removeUserAuth,
    } = useContext(UserContext);
    const {
        startActionsRef,
        midActionsRef,
        endActionsRef,
    } = useContext(NavbarContext);

    const [{ fetching }, triggerLogout] = useMutation<LogoutMutation, LogoutMutationVariables>(
        LOGOUT_MUTATION,
    );

    const handleLogoutClick = useCallback(
        async () => {
            const response = await triggerLogout({});
            if (response.data?.public.logout.ok) {
                removeUserAuth();
            }
        },
        [triggerLogout, removeUserAuth],
    );

    return (
        <nav className={_cs(styles.navbar, className)}>
            <div
                className={styles.startActions}
                ref={startActionsRef}
            />
            <div className={styles.brand}>
                <Link
                    linkElementClassName={styles.homeLink}
                    to="home"
                    icons={(
                        <img
                            className={styles.appLogo}
                            alt=""
                            src={timurLogo}
                        />
                    )}
                >
                    Timur
                </Link>
            </div>
            <div
                className={styles.middleActions}
                ref={midActionsRef}
            />
            <div className={styles.auth}>
                {isNotDefined(userAuth) && (
                    <Link
                        external
                        href={`${import.meta.env.APP_AUTH_URL}?redirect_to=${window.location.href}`}
                    >
                        Login
                    </Link>
                )}
                {isDefined(userAuth) && (
                    <DropdownMenu
                        variant="transparent"
                        withoutDropdownIcon
                        label={(
                            <DisplayPicture
                                className={styles.displayPicture}
                                imageUrl={userAuth.displayPicture}
                                displayName={userAuth.displayName ?? userAuth.email}
                            />
                        )}
                        title="Show user actions"
                    >
                        <div className={styles.greetings}>
                            {`Hello ${userAuth.displayName}!`}
                        </div>
                        {userAuth.isStaff && (
                            <DropdownMenuItem
                                type="link"
                                external
                                href={import.meta.env.APP_ADMIN_URL}
                                icons={<RiAdminLine />}
                            >
                                Admin Panel
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            type="link"
                            to="settings"
                            icons={<RiSettings4Line />}
                        >
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            type="button"
                            name={undefined}
                            onClick={handleLogoutClick}
                            disabled={fetching}
                            icons={<RiLogoutBoxLine />}
                            title="Log out"
                        >
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenu>
                )}
            </div>
            <div
                className={styles.endActions}
                ref={endActionsRef}
            />
        </nav>
    );
}

export default Navbar;
