import {
    useCallback,
    useContext,
} from 'react';
import {
    RiAdminLine,
    RiLogoutBoxLine,
} from 'react-icons/ri';
import {
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
import UserContext from '#contexts/user';
import {
    LogoutMutation,
    LogoutMutationVariables,
} from '#generated/types/graphql';

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

function UserMenu(props: Props) {
    const { className } = props;
    const { userAuth, removeUserAuth } = useContext(UserContext);

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

    if (isNotDefined(userAuth)) {
        return (
            <Link
                className={className}
                external
                href={`${import.meta.env.APP_GRAPHQL_DOMAIN}/?redirect_to=${window.location.href}`}
            >
                Login
            </Link>
        );
    }

    return isDefined(userAuth) ? (
        <DropdownMenu
            className={className}
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
                {userAuth.displayName ?? 'Hari Bahadur'}
            </div>
            {userAuth.isStaff && (
                <DropdownMenuItem
                    type="link"
                    external
                    href={`${import.meta.env.APP_GRAPHQL_DOMAIN}/admin`}
                    icons={<RiAdminLine />}
                >
                    Admin Panel
                </DropdownMenuItem>
            )}
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
    ) : null;
}

export default UserMenu;
