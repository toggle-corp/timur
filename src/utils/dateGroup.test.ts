import {
    expect,
    test,
} from 'vitest';

import {
    getDayTracks,
    getIsoWeek,
    groupDatesByIsoWeek,
} from './dateGroup';

test('ISO week', () => {
    expect(getIsoWeek(new Date(2026, 8, 7))).toEqual({ year: 2026, week: 37 });
    // A week belongs to the year of its Thursday
    expect(getIsoWeek(new Date(2027, 0, 1))).toEqual({ year: 2026, week: 53 });
    expect(getIsoWeek(new Date(2024, 11, 30))).toEqual({ year: 2025, week: 1 });
});

test('Group dates by ISO week', () => {
    expect(groupDatesByIsoWeek([
        '2026-09-03',
        '2026-09-04',
        '2026-09-05',
        '2026-09-07',
        '2026-09-14',
    ])).toEqual([
        {
            key: '2026-36', label: 'W36', firstDate: '2026-09-03', span: 3,
        },
        {
            key: '2026-37', label: 'W37', firstDate: '2026-09-07', span: 1,
        },
        {
            key: '2026-38', label: 'W38', firstDate: '2026-09-14', span: 1,
        },
    ]);
});

test('Day tracks', () => {
    // Fri, Mon, Wed 30th, Thu 1st
    const dayTracks = getDayTracks(['2026-09-25', '2026-09-28', '2026-09-30', '2026-10-01']);
    expect(dayTracks.boundaries).toEqual({ '2026-09-28': 'week', '2026-10-01': 'month' });
    expect(dayTracks.tracks).toEqual([
        '1fr',
        'var(--spacing-sm)',
        '1fr',
        '1fr',
        'var(--spacing-sm)',
        '1fr',
    ]);
    expect(dayTracks.trackOffsets).toEqual([0, 2, 3, 5]);
    // A group spans the boundary tracks inside it
    expect(dayTracks.weeks.map((week) => (
        [week.label, week.startIndex, week.trackStart, week.trackSpan]
    ))).toEqual([['W39', 0, 0, 1], ['W40', 1, 2, 4]]);
    expect(dayTracks.months.map((month) => (
        [month.startIndex, month.trackStart, month.trackSpan]
    ))).toEqual([[0, 0, 4], [3, 5, 1]]);
});
