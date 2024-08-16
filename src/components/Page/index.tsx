import {
    useEffect,
    useState,
} from 'react';
import {
    IoChevronForward,
    IoClose,
    IoMenu,
} from 'react-icons/io5';
import { _cs } from '@togglecorp/fujs';

import Button from '#components/Button';

import styles from './styles.module.css';

interface Props {
    className?: string;
    documentTitle: string;
    startAsideContainerClassName?: string;
    startAsideContent?: React.ReactNode;
    endAsideContainerClassName?: string;
    endAsideContent?: React.ReactNode;
    children: React.ReactNode;
    contentClassName?: string;
}

function Page(props: Props) {
    const {
        className,
        documentTitle,
        startAsideContent,
        startAsideContainerClassName,
        endAsideContent,
        children,
        contentClassName,
        endAsideContainerClassName,
    } = props;

    useEffect(() => {
        document.title = documentTitle;
    }, [documentTitle]);

    const [startSidebarCollapsed, setStartSidebarCollapsed] = useState(false);

    return (
        <div
            className={_cs(
                styles.page,
                startSidebarCollapsed && styles.startSidebarCollapsed,
                className,
            )}
        >
            {startAsideContent && (
                <aside className={_cs(styles.startAside, startAsideContainerClassName)}>
                    <Button
                        name={!startSidebarCollapsed}
                        spacing="sm"
                        onClick={setStartSidebarCollapsed}
                        className={styles.toggleCollapsedButton}
                        variant="tertiary"
                    >
                        {startSidebarCollapsed ? <IoMenu /> : <IoClose />}
                    </Button>
                    {startAsideContent}
                </aside>
            )}
            <main className={styles.main}>
                <div className={_cs(styles.content, contentClassName)}>
                    {children}
                </div>
            </main>
            {endAsideContent && (
                <aside className={_cs(styles.endAside, endAsideContainerClassName)}>
                    {endAsideContent}
                </aside>
            )}
        </div>
    );
}

export default Page;
