import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    gql,
    useQuery,
} from 'urql';

import UserContext, {
    UserAuth,
    UserContextProps,
} from '#contexts/user';
import {
    MeQuery,
    MeQueryVariables,
} from '#generated/types/graphql';
import icon from '#resources/icon.svg';

import styles from './styles.module.css';

const ME_QUERY = gql`
    query Me {
        public {
            id
            me {
                displayName
                displayPicture
                email
                firstName
                id
                lastName
                isStaff
                loginExpire
            }
        }
    }
`;

const fallbackElement = (
    <div className={styles.fallbackElement}>
        <img
            className={styles.appLogo}
            alt="Timur Icon"
            src={icon}
        />
    </div>
);

interface BaseProps {
    children: React.ReactNode;
}

function AuthProvider(props: BaseProps) {
    const { children } = props;

    const [userAuth, setUserAuth] = useState<UserAuth>();
    const [ready, setReady] = useState(false);

    const [meResult] = useQuery<MeQuery, MeQueryVariables>(
        { query: ME_QUERY },
    );

    useEffect(() => {
        if (meResult.fetching) {
            return;
        }
        setUserAuth(meResult.data?.public.me ?? undefined);
        setReady(true);
    }, [meResult.data, meResult.fetching]);

    const removeUserAuth = useCallback(
        () => {
            setUserAuth(undefined);
        },
        [],
    );

    const userContextValue = useMemo<UserContextProps>(
        () => ({
            userAuth,
            setUserAuth,
            removeUserAuth,
        }),
        [userAuth, removeUserAuth],
    );

    // NOTE: We should block page for authentication before we mount routes
    if (!ready) {
        // TODO: Handle error with authentication
        return fallbackElement;
    }

    return (
        <UserContext.Provider value={userContextValue}>
            {children}
        </UserContext.Provider>
    );
}

export default AuthProvider;
