import { _cs } from '@togglecorp/fujs';

import styles from './styles.module.css';

interface Props {
    className?: string;
    heading?: React.ReactNode;
    // The md swatch is sized to the text, to hold a mark or an icon
    swatchSize?: 'sm' | 'md';
    elementType?: 'div' | 'figcaption';
    // For a legend that repeats what the text of the chart already says
    'aria-hidden'?: boolean;
    children: React.ReactNode;
}

function Legend(props: Props) {
    const {
        className,
        heading,
        swatchSize = 'md',
        elementType: Element = 'div',
        'aria-hidden': ariaHidden,
        children,
    } = props;

    return (
        <Element
            className={_cs(styles.legend, styles[swatchSize], className)}
            aria-hidden={ariaHidden}
        >
            {heading && (
                <span className={styles.heading}>
                    {heading}
                </span>
            )}
            {children}
        </Element>
    );
}

interface ItemProps {
    className?: string;
    label: React.ReactNode;
    // Colours the swatch
    swatchClassName?: string;
    // A mark inside the swatch
    swatchContent?: React.ReactNode;
    // Shown in place of the swatch
    icon?: React.ReactNode;
}

export function LegendItem(props: ItemProps) {
    const {
        className,
        label,
        swatchClassName,
        swatchContent,
        icon,
    } = props;

    return (
        <span className={_cs(styles.item, className)}>
            {icon ?? (
                <span
                    className={_cs(styles.swatch, swatchClassName)}
                    aria-hidden
                >
                    {swatchContent}
                </span>
            )}
            {label}
        </span>
    );
}

export default Legend;
