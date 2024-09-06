import { _cs } from '@togglecorp/fujs';

import styles from './styles.module.css';

interface SplitVariantProps {
    variant: 'split';
    primaryPreText?: React.ReactNode;
    primaryHeading?: React.ReactNode;
    primaryDescription?: React.ReactNode;
    secondaryHeading: React.ReactNode;
    secondaryContent: React.ReactNode;
}

interface GeneralVariantProps {
    variant: 'general';
    heading?: React.ReactNode;
    children?: React.ReactNode;
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
        } = props;

        return (
            <section className={className}>
                {heading && (
                    <h2 className={styles.heading}>
                        {heading}
                    </h2>
                )}
                {children}
            </section>
        );
    }

    const {
        primaryPreText,
        primaryHeading,
        primaryDescription,
        secondaryHeading,
        secondaryContent,
    } = props;

    return (
        <div className={className}>
            <section className={styles.startSection}>
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
            </section>
            <section className={styles.endSection}>
                <h3 className={styles.secondaryHeading}>
                    {secondaryHeading}
                </h3>
                <hr className={styles.separator} />
                <div className={styles.secondaryContent}>
                    {secondaryContent}
                </div>
            </section>
        </div>
    );
}

export default Slide;
