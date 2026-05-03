import {
    RiBallPenLine,
    RiHome2Line,
    RiSlideshow4Line,
} from 'react-icons/ri';
import { useLocation } from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';

import Link from '#components/Link';
import UserMenu from '#components/UserMenu';

import { type WrappedRoutes } from '../../App/routes';

import styles from './styles.module.css';

interface NavItem {
    to: keyof WrappedRoutes;
    pathPrefix: string;
    label: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    {
        to: 'home',
        pathPrefix: '/',
        label: 'Home',
        icon: <RiHome2Line />,
    },
    {
        to: 'dailyJournal',
        pathPrefix: '/daily-journal',
        label: 'Journal',
        icon: <RiBallPenLine />,
    },
    {
        to: 'dailyStandup',
        pathPrefix: '/daily-standup',
        label: 'Standup',
        icon: <RiSlideshow4Line />,
    },
];

function isActive(pathname: string, prefix: string): boolean {
    if (prefix === '/') {
        return pathname === '/';
    }
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

interface Props {
    className?: string;
}

function BottomNav(props: Props) {
    const { className } = props;
    const { pathname } = useLocation();

    return (
        <nav className={_cs(styles.bottomNav, className)}>
            {navItems.map((item) => (
                <Link
                    key={item.to}
                    to={item.to}
                    title={item.label}
                    linkElementClassName={_cs(
                        styles.navItem,
                        isActive(pathname, item.pathPrefix) && styles.active,
                    )}
                >
                    {item.icon}
                </Link>
            ))}
            <UserMenu
                className={styles.userMenu}
            />
        </nav>
    );
}

export default BottomNav;
