import { useContext } from 'react';
import { _cs } from '@togglecorp/fujs';

import Link from '#components/Link';
import UserMenu from '#components/UserMenu';
import NavbarContext from '#contexts/navbar';

import styles from './styles.module.css';

interface Props {
    className?: string;
}

function Navbar(props: Props) {
    const { className } = props;
    const {
        startActionsRef,
        midActionsRef,
        endActionsRef,
    } = useContext(NavbarContext);

    return (
        <nav className={_cs(styles.navbar, className)}>
            <div
                className={styles.startActions}
                ref={startActionsRef}
            />
            <div className={styles.brand}>
                <Link
                    className={styles.desktopOnly}
                    linkElementClassName={styles.homeLink}
                    to="home"
                >
                    Timur
                </Link>
                <span className={_cs(styles.homeLink, styles.mobileOnly)}>
                    Timur
                </span>
            </div>
            <div
                className={styles.middleActions}
                ref={midActionsRef}
            />
            <UserMenu className={styles.auth} />
            <div
                className={styles.endActions}
                ref={endActionsRef}
            />
        </nav>
    );
}

export default Navbar;
