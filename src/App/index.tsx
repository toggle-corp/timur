import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    createBrowserRouter,
    RouterProvider,
} from 'react-router-dom';

import RouteContext from '#contexts/route';
import UserContext, {
    UserAuth,
    UserContextProps,
} from '#contexts/user';

import timurLogo from './icon.svg';
import wrappedRoutes, { unwrappedRoutes } from './routes';

import styles from './styles.module.css';

const router = createBrowserRouter(unwrappedRoutes);

function App() {
    // AUTH

    const [userAuth, setUserAuth] = useState<UserAuth>();

    const hydrateUserAuth = useCallback(() => {
        console.warn('We do not have any mechanism to hydrate authentication');
    }, []);

    const removeUserAuth = useCallback(() => {
        setUserAuth(undefined);
    }, []);

    const setAndStoreUserAuth = useCallback((newUserDetails: UserAuth) => {
        setUserAuth(newUserDetails);
    }, []);

    // Hydration
    useEffect(() => {
        hydrateUserAuth();
    }, [hydrateUserAuth]);

    const userContextValue = useMemo<UserContextProps>(
        () => ({
            userAuth,
            hydrateUserAuth,
            setUserAuth: setAndStoreUserAuth,
            removeUserAuth,
        }),
        [userAuth, hydrateUserAuth, setAndStoreUserAuth, removeUserAuth],
    );

    return (
        <RouteContext.Provider value={wrappedRoutes}>
            <UserContext.Provider value={userContextValue}>
                <RouterProvider
                    router={router}
                    fallbackElement={(
                        <div className={styles.fallbackElement}>
                            <img
                                className={styles.appLogo}
                                alt="Timur Icon"
                                src={timurLogo}
                            />
                            Timur Loading...
                        </div>
                    )}
                />
            </UserContext.Provider>
        </RouteContext.Provider>
    );
}

export default App;
