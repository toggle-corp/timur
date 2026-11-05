import { useContext } from 'react';

import UserContext from '#contexts/user';

import styles from './styles.module.css';

interface Props {
    href: string;
    title?: string;
    className?: string;
    children: React.ReactNode;
    // Shown to others in place of the link; the children by default
    fallback?: React.ReactNode;
}

// The admin is open to staff only
function AdminLink(props: Props) {
    const {
        href,
        title,
        className,
        children,
        fallback = children,
    } = props;
    const { userAuth } = useContext(UserContext);

    if (!userAuth?.isStaff) {
        return fallback;
    }

    return (
        <a
            className={className ?? styles.adminLink}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={title}
        >
            {children}
        </a>
    );
}

export default AdminLink;
