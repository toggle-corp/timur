import {
    expect,
    test,
} from 'vitest';

import {
    formatDelta,
    getDelta,
    getDeltaOutcome,
} from './delta';

test('Get delta', () => {
    // Compared as the rounded percentages that are shown
    expect(getDelta(0.6928, 0.8715, 'points')).toBe(-18);
    expect(getDelta(0.874, 0.866, 'points')).toBe(0);
    expect(getDelta(2604.18, 3114.4, 'hours')).toBe(-510.2);
    expect(getDelta(7, 11, 'count')).toBe(-4);
    expect(getDelta(null, 0.5, 'points')).toBeUndefined();
    expect(getDelta(0.5, undefined, 'points')).toBeUndefined();
});

test('Format delta', () => {
    expect(formatDelta(-18, 'points')).toBe('−18 pts');
    expect(formatDelta(1, 'points')).toBe('+1 pt');
    expect(formatDelta(185.5, 'hours')).toBe('+185.5h');
    expect(formatDelta(-4, 'count')).toBe('−4');
    expect(formatDelta(0, 'hours')).toBe('No change');
});

test('Get delta outcome', () => {
    expect(getDeltaOutcome(3, 5, 'lower')).toBe('better');
    expect(getDeltaOutcome(5, 3, 'lower')).toBe('worse');
    expect(getDeltaOutcome(5, 3, 'higher')).toBe('better');
    // Closer to the target is better, from either side
    expect(getDeltaOutcome(0.95, 0.85, { target: 1 })).toBe('better');
    expect(getDeltaOutcome(1.2, 1.05, { target: 1 })).toBe('worse');
    expect(getDeltaOutcome(1.1, 0.9, { target: 1 })).toBeUndefined();
});
