import { _cs } from '@togglecorp/fujs';

import timurLogo from '../../App/icon.svg';

import styles from './styles.module.css';

interface Props {
    className?: string;
}

function Navbar(props: Props) {
    const { className } = props;

    return (
        <nav className={_cs(styles.navbar, className)}>
            <img
                className={styles.appLogo}
                alt="Timur Icon"
                src={timurLogo}
            />
            <div className={styles.brand}>
                Timur
            </div>
        </nav>
    );
}

export default Navbar;
