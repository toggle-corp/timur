import { useLocation } from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';

import Link from '#components/Link';
import UserMenu from '#components/UserMenu';
import {
    homeSection,
    isInSection,
    journalSection,
    standupSection,
} from '#utils/navigation';

import styles from './styles.module.css';

const sections = [
    homeSection,
    journalSection,
    standupSection,
];

interface Props {
    className?: string;
}

function BottomNav(props: Props) {
    const { className } = props;
    const { pathname } = useLocation();

    return (
        <nav className={_cs(styles.bottomNav, className)}>
            {sections.map((section) => {
                const active = isInSection(pathname, section);
                return (
                    <Link
                        key={section.to}
                        className={styles.navCell}
                        to={section.to}
                        title={section.label}
                        aria-current={active ? 'page' : undefined}
                        linkElementClassName={_cs(styles.navItem, active && styles.active)}
                    >
                        <section.icon />
                    </Link>
                );
            })}
            <UserMenu
                className={styles.userMenu}
            />
        </nav>
    );
}

export default BottomNav;
