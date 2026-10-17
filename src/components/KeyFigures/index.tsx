import { _cs } from '@togglecorp/fujs';

import Definition from '#components/Definition';
import Delta from '#components/Delta';
import {
    type DeltaBetter,
    type DeltaUnit,
} from '#utils/delta';

import styles from './styles.module.css';

const NO_BREAK_SPACE = '\u00a0';

export interface KeyFigure {
    key: string;
    label: string;
    value: string;
    detail?: string;
    current: number | null | undefined;
    previous: number | null | undefined;
    unit: DeltaUnit;
    // Colours the change as better or worse
    better?: DeltaBetter;
    definition: string;
}

interface Props {
    className?: string;
    label: string;
    figures: KeyFigure[];
    // Without it the figures show no change
    comparedTo?: string;
    // Smaller figures that fit more to a row
    compact?: boolean;
}

function KeyFigures(props: Props) {
    const {
        className,
        label,
        figures,
        comparedTo,
        compact,
    } = props;

    return (
        <section
            className={_cs(styles.keyFigures, compact && styles.compact, className)}
            aria-label={label}
        >
            <dl className={styles.figures}>
                {figures.map((figure) => (
                    <div
                        key={figure.key}
                        className={styles.figure}
                    >
                        <dt className={styles.label}>
                            {figure.label}
                            <Definition term={figure.label}>
                                {figure.definition}
                            </Definition>
                        </dt>
                        <dd className={styles.value}>
                            {figure.value}
                        </dd>
                        {figure.detail && (
                            <dd className={styles.detail}>
                                {figure.detail}
                            </dd>
                        )}
                        {comparedTo && (
                            <dd>
                                <Delta
                                    current={figure.current}
                                    previous={figure.previous}
                                    unit={figure.unit}
                                    comparedTo={comparedTo}
                                    better={figure.better}
                                />
                            </dd>
                        )}
                        {/* NOTE: Compact figures keep a line below the value, for one height */}
                        {compact && !figure.detail && !comparedTo && (
                            <dd
                                className={styles.detail}
                                aria-hidden
                            >
                                {NO_BREAK_SPACE}
                            </dd>
                        )}
                    </div>
                ))}
            </dl>
        </section>
    );
}

export default KeyFigures;
