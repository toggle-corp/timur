import { isNotDefined } from '@togglecorp/fujs';

import { formatHours } from '#utils/common';

export type DeltaUnit = 'hours' | 'points' | 'count';

// Which way a change is better: down, up, or towards a target value
export type DeltaBetter = 'lower' | 'higher' | { target: number };

export function getDeltaOutcome(
    current: number,
    previous: number,
    better: DeltaBetter,
): 'better' | 'worse' | undefined {
    let gain;
    if (better === 'lower') {
        gain = previous - current;
    } else if (better === 'higher') {
        gain = current - previous;
    } else {
        gain = Math.abs(previous - better.target) - Math.abs(current - better.target);
    }
    // Rounded, as two values equally far from a target can differ in the last binary digits
    const roundedGain = Math.round(gain * 1e6);
    if (roundedGain === 0) {
        return undefined;
    }
    return roundedGain > 0 ? 'better' : 'worse';
}

const MINUS_SIGN = '−';

// Change between the figures as shown: percentages in whole points, hours to one decimal
export function getDelta(
    current: number | null | undefined,
    previous: number | null | undefined,
    unit: DeltaUnit,
) {
    if (isNotDefined(current) || isNotDefined(previous)) {
        return undefined;
    }
    if (unit === 'points') {
        return Math.round(current * 100) - Math.round(previous * 100);
    }
    if (unit === 'hours') {
        return Math.round((current - previous) * 10) / 10;
    }
    return current - previous;
}

export function formatDelta(delta: number, unit: DeltaUnit) {
    if (delta === 0) {
        return 'No change';
    }
    const sign = delta > 0 ? '+' : MINUS_SIGN;
    const size = Math.abs(delta);
    if (unit === 'hours') {
        return `${sign}${formatHours(size)}`;
    }
    if (unit === 'points') {
        return `${sign}${size} ${size === 1 ? 'pt' : 'pts'}`;
    }
    return `${sign}${size}`;
}
