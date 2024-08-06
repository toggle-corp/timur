import {
    useCallback,
    useContext,
} from 'react';
import {
    _cs,
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    gql,
    useMutation,
} from 'urql';

import Button from '#components/Button';
import UserContext from '#contexts/user';

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

    const [, triggerLogout] = useMutation(
        LOGOUT_MUTATION,
    );

    const handleLogoutClick = useCallback(async () => {
        await triggerLogout();
        removeUserAuth();
    }, [triggerLogout, removeUserAuth]);

    /*
        {
            onCompleted: (response) => {
                if (response.public.logout.ok) {
                    removeUserAuth();
                }
            },
        },
        */

    return (
        <nav className={_cs(styles.navbar, className)}>
            <div className={styles.brand}>
                <img
                    className={styles.appLogo}
                    alt="Timur Icon"
                    src={timurLogo}
                />
                <div className={styles.appName}>
                    timur
                </div>
            </div>
            <div className={styles.auth}>
                {isNotDefined(userAuth) && (
                    <a
                        href={`${import.meta.env.APP_AUTH_URL}?redirect_to=${window.location.href}`}
                    >
                        Sign in
                    </a>
                )}
                {isDefined(userAuth) && (
                    <>
                        {isDefined(userAuth.displayPicture) && (
                            <img
                                className={styles.displayPicture}
                                src={userAuth.displayPicture}
                                alt=""
                            />
                        )}
                        <div>
                            {userAuth.displayName}
                        </div>
                        <Button
                            name={undefined}
                            onClick={handleLogoutClick}
                            // disabled={logoutPending}
                            variant="secondary"
                        >
                            Sign out
                        </Button>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
