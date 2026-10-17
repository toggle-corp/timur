import {
    RiArrowDownLine,
    RiArrowUpLine,
} from 'react-icons/ri';
import {
    _cs,
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import {
    type DeltaBetter,
    type DeltaUnit,
    formatDelta,
    getDelta,
    getDeltaOutcome,
} from '#utils/delta';

import styles from './styles.module.css';

interface Props {
    className?: string;
    current: number | null | undefined;
    previous: number | null | undefined;
    unit: DeltaUnit;
    // Name of the previous period, such as a month
    comparedTo: string;
    // Keeps the period for screen readers only
    hideComparedTo?: boolean;
    // Colours the change as better or worse
    better?: DeltaBetter;
}

function Delta(props: Props) {
    const {
        className,
        current,
        previous,
        unit,
        comparedTo,
        hideComparedTo,
        better,
    } = props;

    const delta = getDelta(current, previous, unit);
    const comparedToLabel = (
        <span className={hideComparedTo ? styles.visuallyHidden : styles.comparedTo}>
            {isNotDefined(delta) ? ` in ${comparedTo}` : ` vs ${comparedTo}`}
        </span>
    );

    if (isNotDefined(delta)) {
        return (
            <span className={_cs(styles.delta, className)}>
                No figure
                {comparedToLabel}
            </span>
        );
    }

    let Icon;
    if (delta > 0) {
        Icon = RiArrowUpLine;
    } else if (delta < 0) {
        Icon = RiArrowDownLine;
    }

    const outcome = better && isDefined(current) && isDefined(previous) && delta !== 0
        ? getDeltaOutcome(current, previous, better)
        : undefined;

    return (
        <span className={_cs(styles.delta, outcome && styles[outcome], className)}>
            {Icon && (
                <Icon
                    className={styles.icon}
                    aria-hidden
                />
            )}
            {formatDelta(delta, unit)}
            {outcome && (
                <span className={styles.visuallyHidden}>
                    {`, ${outcome}`}
                </span>
            )}
            {comparedToLabel}
        </span>
    );
}

export default Delta;
