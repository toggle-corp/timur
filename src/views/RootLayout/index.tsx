import {
    useContext,
    useMemo,
    useRef,
} from 'react';
import {
    Outlet,
    useNavigation,
} from 'react-router-dom';
import {
    _cs,
    compareDate,
} from '@togglecorp/fujs';

import BottomNav from '#components/BottomNav';
import Navbar from '#components/Navbar';
import CommandContext from '#contexts/command';
import UserContext from '#contexts/user';
import useCurrentDate from '#hooks/useCurrentDate';
import useDebouncedValue from '#hooks/useDebouncedValue';
import useScrollHide from '#hooks/useScrollHide';
import icon from '#resources/icon.svg';

import styles from './styles.module.css';

const REMAINING_DAYS_THRESHOLD = 5;

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const { state } = useNavigation();
    const isLoading = state === 'loading';
    const isLoadingDebounced = useDebouncedValue(isLoading);
    const {
        userAuth,
    } = useContext(UserContext);
    const { inFlight } = useContext(CommandContext);

    const todayDate = useCurrentDate();
    const daysBeforeLogout = useMemo(() => (
        compareDate(userAuth?.loginExpire, todayDate) / (60 * 60 * 1000 * 24)
    ), [
        todayDate,
        userAuth?.loginExpire,
    ]);

    const pageContentRef = useRef<HTMLDivElement>(null);
    const navbarHidden = useScrollHide(pageContentRef);
    return (
        <div className={styles.root}>
            {(isLoading || isLoadingDebounced) && (
                <div
                    className={_cs(
                        styles.navigationLoader,
                        !isLoading && isLoadingDebounced && styles.disappear,
                    )}
                />
            )}
            {userAuth && daysBeforeLogout < REMAINING_DAYS_THRESHOLD && (
                <div className={styles.nagbar}>
                    {`You'll be automatically logged out in ${Math.floor(daysBeforeLogout)} days unless you re-login.`}
                </div>
            )}
            <div
                ref={pageContentRef}
                className={styles.pageContent}
            >
                <Navbar
                    className={_cs(
                        styles.navbar,
                        navbarHidden && styles.navbarHidden,
                    )}
                />
                <Outlet />
                <div
                    className={_cs(
                        styles.savingIndicator,
                        inFlight && styles.active,
                        navbarHidden && styles.navbarHidden,
                    )}
                >
                    <img
                        className={styles.savingIcon}
                        alt=""
                        src={icon}
                    />
                    <span>
                        Saving...
                    </span>
                </div>
            </div>
            <BottomNav className={styles.bottomNav} />
        </div>
    );
}

Component.displayName = 'Root';
