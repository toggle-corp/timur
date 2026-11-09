import { useMemo } from 'react';
import { RiCalendarLine } from 'react-icons/ri';
import {
    _cs,
    compareNumber,
    compareString,
    decodeDate,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import DefaultMessage from '#components/DefaultMessage';
import Link from '#components/Link';
import OccupancyHeatmap, { OccupancyLegend } from '#components/OccupancyHeatmap';
import { isMissingDay } from '#components/OccupancyHeatmap/utils';
import {
    type DailyStandupOccupancyQuery,
    type DailyStandupOccupancyQueryVariables,
} from '#generated/types/graphql';
import { shortDateFormatter } from '#utils/common';
import { getMonth } from '#utils/month';

import Slide from '../Slide';
import SlideFooter from '../SlideFooter';

import styles from './styles.module.css';

const DAILY_STANDUP_OCCUPANCY_QUERY = gql`
    query DailyStandupOccupancy($date: Date!) {
        private {
            id
            dailyStandup(date: $date) {
                id
                occupancy {
                    id
                    startDate
                    endDate
                    dates
                    users {
                        id
                        user {
                            id
                            displayName
                            displayPicture
                        }
                        days {
                            date
                            hours
                            leave
                            leaveDisplay
                            occupancy
                            expectedHours
                        }
                    }
                }
            }
        }
    }
`;

function formatRange(startDate: string, endDate: string) {
    return shortDateFormatter.formatRange(decodeDate(startDate), decodeDate(endDate));
}

// Missing counts for these many most recent working days are shown as a warning
const RECENT_DAYS_COUNT = 2;
const RECENT_DAYS_LABEL = `last ${RECENT_DAYS_COUNT} working days`;

// NOTE: Users are sorted by descending severity
const SEVERITY = {
    upToDate: 0,
    recentMissing: 1,
    olderMissing: 2,
} as const;
type Severity = typeof SEVERITY[keyof typeof SEVERITY];

// The first week of a month shows the whole previous month, which starts on its 1st
function getMonthlyViewMonth(startDate: string, date: string) {
    return getMonth(decodeDate(startDate).getDate() === 1 ? startDate : date);
}

interface Props {
    date: string;
    currentSlide: number | undefined;
    totalSlides: number | undefined;
}

function OccupancySection(props: Props) {
    const {
        date,
        currentSlide,
        totalSlides,
    } = props;

    const [occupancyResponse] = useQuery<
        DailyStandupOccupancyQuery,
        DailyStandupOccupancyQueryVariables
    >({
        query: DAILY_STANDUP_OCCUPANCY_QUERY,
        variables: { date },
        requestPolicy: 'cache-and-network',
    });

    const occupancy = occupancyResponse.data?.private.dailyStandup.occupancy;

    const recentDates = useMemo(
        () => new Set((occupancy?.dates ?? []).slice(-RECENT_DAYS_COUNT)),
        [occupancy?.dates],
    );

    const sortedUsers = useMemo(
        () => (occupancy?.users ?? [])
            .map((item) => {
                const missingDays = item.days.filter((day) => isMissingDay(day));
                const hasOlderMissing = missingDays.some((day) => !recentDates.has(day.date));
                let severity: Severity = SEVERITY.upToDate;
                if (hasOlderMissing) {
                    severity = SEVERITY.olderMissing;
                } else if (missingDays.length > 0) {
                    severity = SEVERITY.recentMissing;
                }
                return {
                    ...item,
                    missingCount: missingDays.length,
                    severity,
                    firstMissingDate: missingDays[0]?.date,
                };
            })
            .sort((foo, bar) => (
                compareNumber(foo.severity, bar.severity, -1)
                || compareNumber(foo.missingCount, bar.missingCount, -1)
                || compareString(foo.firstMissingDate, bar.firstMissingDate)
                || compareString(foo.user.displayName, bar.user.displayName)
            )),
        [occupancy?.users, recentDates],
    );

    const usersWithMissing = sortedUsers.filter(
        (item) => item.severity === SEVERITY.olderMissing,
    ).length;
    const usersWithRecentMissing = sortedUsers.filter(
        (item) => item.severity === SEVERITY.recentMissing,
    ).length;
    const more = usersWithMissing > 0 ? ' more' : '';
    const isEmpty = sortedUsers.length === 0 || (occupancy?.dates.length ?? 0) === 0;

    return (
        <Slide
            className={styles.occupancySection}
            variant="general"
            heading="Is your Timur up to date?"
            description={occupancy && (
                <div className={styles.description}>
                    {formatRange(occupancy.startDate, occupancy.endDate)}
                    <Link
                        className={styles.monthlyViewLink}
                        to="timesheets"
                        urlParams={{ month: getMonthlyViewMonth(occupancy.startDate, date) }}
                        variant="transparent"
                        icons={<RiCalendarLine />}
                    >
                        Monthly view
                    </Link>
                </div>
            )}
            headerActions={(
                <div className={styles.summary}>
                    {!isEmpty && usersWithMissing > 0 && (
                        <span className={styles.hasMissing}>
                            {usersWithMissing === 1
                                ? '1 person has days without entries or leave'
                                : `${usersWithMissing} people have days without entries or leave`}
                        </span>
                    )}
                    {!isEmpty && usersWithRecentMissing > 0 && (
                        <span className={styles.hasRecentMissing}>
                            {usersWithRecentMissing === 1
                                ? `1${more} person is only missing the ${RECENT_DAYS_LABEL}`
                                : `${usersWithRecentMissing}${more} people are only missing the ${RECENT_DAYS_LABEL}`}
                        </span>
                    )}
                    {!isEmpty && usersWithMissing + usersWithRecentMissing === 0 && (
                        <span>Everyone is up to date!</span>
                    )}
                    <OccupancyLegend />
                </div>
            )}
            footer={(
                <SlideFooter
                    currentSlide={currentSlide}
                    totalSlides={totalSlides}
                />
            )}
        >
            {!isEmpty && (
                <OccupancyHeatmap
                    label="Occupancy"
                    withGroupBands
                    dates={occupancy?.dates ?? []}
                    rows={sortedUsers.map((item) => ({
                        key: item.id,
                        displayName: item.user.displayName,
                        displayPicture: item.user.displayPicture,
                        days: item.days,
                        labelSuffix: (
                            <span
                                className={_cs(
                                    styles.missingCount,
                                    item.severity === SEVERITY.olderMissing
                                        && styles.hasMissing,
                                    item.severity === SEVERITY.recentMissing
                                        && styles.hasRecentMissing,
                                )}
                            >
                                {item.missingCount > 0 ? item.missingCount : '✓'}
                            </span>
                        ),
                    }))}
                    labelSuffixHeading={(
                        <span className={styles.missingHeading}>
                            Missing
                        </span>
                    )}
                    loading={occupancyResponse.fetching}
                />
            )}
            <DefaultMessage
                className={styles.message}
                compact
                filtered={false}
                empty={isEmpty}
                pending={isEmpty && occupancyResponse.fetching}
                errored={!!occupancyResponse.error}
                pendingMessage="Crunching the numbers"
                errorMessage="Something went sideways!"
                emptyMessage="No working days to show yet!"
            />
        </Slide>
    );
}

export default OccupancySection;
