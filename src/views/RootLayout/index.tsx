import {
    useContext,
    useMemo,
} from 'react';
import {
    Outlet,
    useNavigation,
} from 'react-router-dom';
import {
    _cs,
    compareDate,
} from '@togglecorp/fujs';

import Navbar from '#components/Navbar';
import UserContext from '#contexts/user';
import useCurrentDate from '#hooks/useCurrentDate';
import useDebouncedValue from '#hooks/useDebouncedValue';

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

    const todayDate = useCurrentDate();
    const daysBeforeLogout = useMemo(() => (
        compareDate(userAuth?.loginExpire, todayDate) / (60 * 60 * 1000 * 24)
    ), [
        todayDate,
        userAuth?.loginExpire,
    ]);

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
                    {`You'll be automatically logged out in ${Math.floor(daysBeforeLogout)} days. Please re-login to avoid unexpected logout.`}
                </div>
            )}
            <Navbar className={styles.navbar} />
            <div className={styles.pageContent}>
                <Outlet />
            </div>
        </div>
    );
}

Component.displayName = 'Root';
