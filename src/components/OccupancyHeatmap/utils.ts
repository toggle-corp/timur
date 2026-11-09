import { isNotDefined } from '@togglecorp/fujs';

import { type OccupancyDay } from './index';

// Upper bounds, in %, of the low and mid occupancy steps, and of a full day
export const LOW_OCCUPANCY_LIMIT = 33;
export const MID_OCCUPANCY_LIMIT = 66;
export const FULL_OCCUPANCY = 100;

export type OccupancyStep = 'low' | 'mid' | 'high' | 'over';

export function getOccupancyStep(percent: number): OccupancyStep {
    if (percent > FULL_OCCUPANCY) {
        return 'over';
    }
    if (percent < LOW_OCCUPANCY_LIMIT) {
        return 'low';
    }
    if (percent < MID_OCCUPANCY_LIMIT) {
        return 'mid';
    }
    return 'high';
}

// A day due without hours, which the day cell marks as missing
export function isMissingDay(day: OccupancyDay, isNonWorking?: boolean) {
    return isNotDefined(day.occupancy)
        && !isNonWorking
        && day.expectedHours !== 0
        && !day.isPending;
}
