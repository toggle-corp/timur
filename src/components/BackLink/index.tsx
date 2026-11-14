import { useCallback } from 'react';
import { RiArrowLeftLine } from 'react-icons/ri';
import {
    useLocation,
    useNavigate,
} from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';

import Link from '#components/Link';

import styles from './styles.module.css';

interface Props {
    className?: string;
    children: React.ReactNode;
}

// Goes back in history when the app has one, else opens the daily journal
function BackLink(props: Props) {
    const {
        className,
        children,
    } = props;

    const location = useLocation();
    const navigate = useNavigate();

    const handleClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
        if (location.key !== 'default') {
            event.preventDefault();
            navigate(-1);
        }
    }, [location.key, navigate]);

    return (
        <Link
            className={_cs(styles.backLink, className)}
            to="dailyJournal"
            variant="tertiary"
            icons={<RiArrowLeftLine />}
            onClick={handleClick}
        >
            {children}
        </Link>
    );
}

export default BackLink;
