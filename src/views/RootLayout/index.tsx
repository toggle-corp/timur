import {
    Outlet,
    useNavigation,
} from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';

import useDebouncedValue from '#hooks/useDebouncedValue';

import styles from './styles.module.css';

interface NavbarProps {
    className?: string;
}
function Navbar(props: NavbarProps) {
    const { className } = props;
    return (
        <div className={className}>
            Navbar
        </div>
    );
}

interface GlobalFooterProps {
    className?: string;
}

function GlobalFooter(props: GlobalFooterProps) {
    const { className } = props;
    return (
        <div className={className}>
            Footer
        </div>
    );
}

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const { state } = useNavigation();
    const isLoading = state === 'loading';
    const isLoadingDebounced = useDebouncedValue(isLoading);

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
            <Navbar className={styles.navbar} />
            <div className={styles.pageContent}>
                <Outlet />
            </div>
            <GlobalFooter className={styles.footer} />
        </div>
    );
}

Component.displayName = 'Root';
