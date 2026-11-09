import { _cs } from '@togglecorp/fujs';

import styles from './styles.module.css';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface Props {
    className?: string;
    heading?: React.ReactNode;
    headingLevel?: HeadingLevel;
    description?: React.ReactNode;
    // Before the heading, such as a logo
    icons?: React.ReactNode;
    // At the end of the header, wrapping below the heading on narrow screens
    actions?: React.ReactNode;
}

function PageHeader(props: Props) {
    const {
        className,
        heading,
        headingLevel = 1,
        description,
        icons,
        actions,
    } = props;

    const Heading = `h${headingLevel}` as const;

    return (
        <header className={_cs(styles.pageHeader, className)}>
            <div className={styles.title}>
                {icons}
                <div className={styles.headingSection}>
                    {heading && (
                        <Heading className={styles.heading}>
                            {heading}
                        </Heading>
                    )}
                    {description && (
                        <div className={styles.description}>
                            {description}
                        </div>
                    )}
                </div>
            </div>
            {actions}
        </header>
    );
}

export default PageHeader;
