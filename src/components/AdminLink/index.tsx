import { useContext } from 'react';

import UserContext from '#contexts/user';

import styles from './styles.module.css';

interface Props {
    href: string;
    title: string;
    className?: string;
    children: React.ReactNode;
}

// The admin is open to staff only, so others get the children without a link
function AdminLink(props: Props) {
    const {
        href,
        title,
        className,
        children,
    } = props;
    const { userAuth } = useContext(UserContext);

    if (!userAuth?.isStaff) {
        return children;
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
