import {
    expect,
    test,
} from 'vitest';

import { isMissingDay } from './utils';

test('Missing day', () => {
    expect(isMissingDay({ date: '2026-09-01', occupancy: null, expectedHours: 7 })).toBe(true);
    // Without the expected hours, as on the standup slide
    expect(isMissingDay({ date: '2026-09-01', occupancy: null })).toBe(true);
    expect(isMissingDay({ date: '2026-09-01', occupancy: 0.5, expectedHours: 7 })).toBe(false);
    expect(isMissingDay({ date: '2026-09-01', occupancy: null, expectedHours: 0 })).toBe(false);
    expect(isMissingDay({ date: '2026-09-01', occupancy: null, isPending: true })).toBe(false);
    expect(isMissingDay({ date: '2026-09-05', occupancy: null }, true)).toBe(false);
});
