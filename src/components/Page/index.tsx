import { useEffect } from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.module.css';

interface Props {
    className?: string;
    documentTitle: string;
    asideContent?: React.ReactNode;
    children: React.ReactNode;
    contentClassName?: string;
}

function Page(props: Props) {
    const {
        className,
        documentTitle,
        asideContent,
        children,
        contentClassName,
    } = props;

    useEffect(() => {
        document.title = documentTitle;
    }, [documentTitle]);

    return (
        <div className={_cs(styles.page, className)}>
            {asideContent && (
                <aside className={styles.aside}>
                    {asideContent}
                </aside>
            )}
            <main className={styles.main}>
                <div className={_cs(styles.content, contentClassName)}>
                    {children}
                </div>
            </main>
        </div>
    );
}

export default Page;
