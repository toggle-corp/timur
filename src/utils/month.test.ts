import {
    expect,
    test,
} from 'vitest';

import {
    addMonths,
    getMonthDates,
    getMonthSearch,
    parseMonth,
} from './month';

test('Add months across years', () => {
    expect(addMonths('2026-10', 1)).toBe('2026-11');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
});

test('Parse month', () => {
    expect(parseMonth('2026-09', '2026-10-13')).toBe('2026-09');
    expect(parseMonth('2026-10', '2026-10-13')).toBe('2026-10');
    // Future, invalid and missing months fall back to the current month
    expect(parseMonth('2026-11', '2026-10-13')).toBe('2026-10');
    expect(parseMonth('2026-13', '2026-10-13')).toBe('2026-10');
    expect(parseMonth('2026-9', '2026-10-13')).toBe('2026-10');
    expect(parseMonth(undefined, '2026-10-13')).toBe('2026-10');
});

test('Month dates', () => {
    expect(getMonthDates('2026-09')).toEqual({ startDate: '2026-09-01', endDate: '2026-09-30' });
    expect(getMonthDates('2024-02')).toEqual({ startDate: '2024-02-01', endDate: '2024-02-29' });
    expect(getMonthDates('2026-12')).toEqual({ startDate: '2026-12-01', endDate: '2026-12-31' });
});

test('Month search', () => {
    expect(getMonthSearch('2026-09', '2026-10')).toBe('month=2026-09');
    expect(getMonthSearch('2026-10', '2026-10')).toBeUndefined();
});
