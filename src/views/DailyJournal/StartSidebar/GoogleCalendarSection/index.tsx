import {
    Fragment,
    useCallback,
    useMemo,
} from 'react';
import {
    _cs,
    decodeDate,
    isDefined,
} from '@togglecorp/fujs';

import Button from '#components/Button';
import { type GoogleCalendarEvent } from '#hooks/useGoogleCalendar';
import { type WorkItem } from '#utils/types';

import styles from './styles.module.css';

const OFFICE_START_HOUR = 9;
const OFFICE_END_HOUR = 17;

function formatGap(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m === 0) {
        return `${h}h`;
    }
    if (h > 0) {
        return `${h}h ${m}m`;
    }
    return `${m}m`;
}

interface ScheduleGapProps {
    minutes: number;
    isSpacer?: boolean;
}

function ScheduleGap(props: ScheduleGapProps) {
    const { minutes, isSpacer } = props;
    return (
        <div
            className={_cs(
                styles.scheduleGap,
                isSpacer && styles.scheduleGapSpacer,
            )}
        >
            <div className={styles.rowTime} />
            <div className={styles.rowMarker} />
            <div className={styles.gapTrack}>
                {minutes > 0 && (
                    <div className={styles.gapLabel}>
                        {formatGap(minutes)}
                    </div>
                )}
            </div>
        </div>
    );
}

const TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
};

interface ScheduleRowProps {
    id: string;
    startMs: number;
    endMs: number;
    title: string;
    isAdded: boolean;
    onSelect: (id: string) => void;
}

function ScheduleRow(props: ScheduleRowProps) {
    const {
        id,
        startMs,
        endMs,
        title,
        isAdded,
        onSelect,
    } = props;

    const startTime = new Date(startMs).toLocaleTimeString([], TIME_FORMAT_OPTIONS);
    const endTime = new Date(endMs).toLocaleTimeString([], TIME_FORMAT_OPTIONS);

    return (
        <div className={styles.scheduleRow}>
            <div className={styles.rowTime}>
                <span>
                    {startTime}
                </span>
                <span className={styles.rowEndTime}>
                    {endTime}
                </span>
            </div>
            <div className={styles.rowMarker}>
                <span
                    className={_cs(
                        styles.dot,
                        isAdded && styles.dotAdded,
                    )}
                />
            </div>
            <Button
                name={id}
                className={_cs(
                    styles.eventCard,
                    isAdded && styles.eventCardAdded,
                )}
                title={isAdded
                    ? 'Re-add entry from this event'
                    : 'Add entry from this event'}
                onClick={onSelect}
                variant="transparent"
                spacing="none"
            >
                {title}
            </Button>
        </div>
    );
}

interface Props {
    date: string;
    addedDescriptions: Set<string>;
    onWorkItemCreateFromCalendar: (override: Partial<WorkItem>) => void;
    loading?: boolean;
    googleEvents: GoogleCalendarEvent[];
}

function GoogleCalendarSection(props: Props) {
    const {
        date,
        addedDescriptions,
        onWorkItemCreateFromCalendar,
        loading,
        googleEvents,
    } = props;

    const { timedGoogleEvents, latestEndMs } = useMemo(() => {
        const timed = googleEvents.map((event) => {
            const startDateTime = event.start.dateTime;
            const endDateTime = event.end.dateTime;
            if (!startDateTime || !endDateTime) {
                return undefined;
            }
            return {
                id: event.id,
                summary: event.summary,
                startMs: new Date(startDateTime).getTime(),
                endMs: new Date(endDateTime).getTime(),
            };
        }).filter(isDefined).toSorted((a, b) => a.startMs - b.startMs);

        let runningMaxEnd = 0;
        const entries = timed.map((event) => {
            const gapMinutes = runningMaxEnd > 0
                ? Math.round((event.startMs - runningMaxEnd) / 60_000)
                : 0;
            runningMaxEnd = Math.max(runningMaxEnd, event.endMs);
            return {
                ...event,
                gapMinutes,
            };
        });

        return { timedGoogleEvents: entries, latestEndMs: runningMaxEnd };
    }, [googleEvents]);

    const { leadingGapMinutes, trailingGapMinutes } = useMemo(() => {
        if (timedGoogleEvents.length <= 0) {
            return { leadingGapMinutes: 0, trailingGapMinutes: 0 };
        }
        const baseDate = decodeDate(date);

        const officeStart = new Date(baseDate);
        officeStart.setHours(OFFICE_START_HOUR, 0, 0, 0);

        const officeEnd = new Date(baseDate);
        officeEnd.setHours(OFFICE_END_HOUR, 0, 0, 0);

        // We can be sure that first element is defined because we are already checking for length
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const firstStart = timedGoogleEvents[0]!.startMs;

        return {
            leadingGapMinutes: Math.max(
                0,
                Math.round((firstStart - officeStart.getTime()) / 60_000),
            ),
            trailingGapMinutes: Math.max(
                0,
                Math.round((officeEnd.getTime() - latestEndMs) / 60_000),
            ),
        };
    }, [timedGoogleEvents, latestEndMs, date]);

    const handleAddFromCalendarEvent = useCallback(
        (eventId: string) => {
            const event = timedGoogleEvents.find((e) => e.id === eventId);
            if (!event) {
                return;
            }
            onWorkItemCreateFromCalendar({
                description: event.summary,
                duration: Math.round((event.endMs - event.startMs) / 60_000),
            });
        },
        [timedGoogleEvents, onWorkItemCreateFromCalendar],
    );

    if (timedGoogleEvents.length === 0) {
        return null;
    }

    return (
        <div
            className={_cs(
                styles.googleCalendarEvents,
                loading && styles.loading,
            )}
        >
            <div className={styles.schedule}>
                {leadingGapMinutes > 0 && (
                    <ScheduleGap minutes={leadingGapMinutes} />
                )}
                {timedGoogleEvents.map((event, index) => {
                    const isAdded = event.summary
                        ? addedDescriptions.has(event.summary.trim().toLowerCase())
                        : false;

                    return (
                        <Fragment key={event.id}>
                            {index > 0 && (
                                <ScheduleGap
                                    minutes={event.gapMinutes}
                                    isSpacer={event.gapMinutes <= 0}
                                />
                            )}
                            <ScheduleRow
                                id={event.id}
                                startMs={event.startMs}
                                endMs={event.endMs}
                                title={event.summary ?? 'Event from calendar'}
                                isAdded={isAdded}
                                onSelect={handleAddFromCalendarEvent}
                            />
                        </Fragment>
                    );
                })}
                {trailingGapMinutes > 0 && (
                    <ScheduleGap minutes={trailingGapMinutes} />
                )}
            </div>
        </div>
    );
}

export default GoogleCalendarSection;
