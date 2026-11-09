import { _cs } from '@togglecorp/fujs';

import styles from './styles.module.css';

interface SplitVariantProps {
    variant: 'split';
    primaryPreText?: React.ReactNode;
    primaryHeading?: React.ReactNode;
    primaryDescription?: React.ReactNode;
    tertiaryContent?: React.ReactNode;
    secondaryHeading: React.ReactNode;
    secondaryContent: React.ReactNode;
    secondaryBackground?: string | undefined;
}

interface GeneralVariantProps {
    variant: 'general';
    heading?: React.ReactNode;
    description?: React.ReactNode;
    headerActions?: React.ReactNode;
    children?: React.ReactNode;
    footer?: React.ReactNode;
}

type Props = {
    className?: string;
} & (SplitVariantProps | GeneralVariantProps);

function Slide(props: Props) {
    const {
        className: classNameFromProps,
        variant,
    } = props;

    const className = _cs(
        styles.slide,
        classNameFromProps,
        variant === 'general' && styles.generalVariant,
        variant === 'split' && styles.splitVariant,
    );

    if (variant === 'general') {
        const {
            children,
            heading,
            description,
            headerActions,
            footer,
        } = props;

        return (
            <section className={className}>
                {(heading || description || headerActions) && (
                    <header className={styles.header}>
                        <div className={styles.headingSection}>
                            {heading && (
                                <h2 className={styles.heading}>
                                    {heading}
                                </h2>
                            )}
                            {description && (
                                <div className={styles.description}>
                                    {description}
                                </div>
                            )}
                        </div>
                        {headerActions}
                    </header>
                )}
                {children}
                {footer && (
                    <footer className={styles.footer}>
                        {footer}
                    </footer>
                )}
            </section>
        );
    }

    const {
        primaryPreText,
        primaryHeading,
        primaryDescription,
        tertiaryContent,
        secondaryHeading,
        secondaryContent,
        secondaryBackground,
    } = props;

    return (
        <div className={className}>
            <section className={styles.startSection}>
                <div className={styles.primarySection}>
                    {primaryPreText && (
                        <div className={styles.primaryPreText}>
                            {primaryPreText}
                        </div>
                    )}
                    <h2 className={styles.primaryHeading}>
                        {primaryHeading}
                    </h2>
                    {primaryDescription && (
                        <div className={styles.primaryDescription}>
                            {primaryDescription}
                        </div>
                    )}
                </div>
                {tertiaryContent && (
                    <div className={styles.tertiarySection}>
                        {tertiaryContent}
                    </div>
                )}
            </section>
            <section
                className={styles.endSection}
            >
                <h3 className={styles.secondaryHeading}>
                    {secondaryHeading}
                </h3>
                <div
                    className={styles.secondaryContent}
                    style={{
                        ['--project-slide-background' as string]: secondaryBackground,
                    }}
                >
                    {secondaryContent}
                </div>
            </section>
        </div>
    );
}

export default Slide;
