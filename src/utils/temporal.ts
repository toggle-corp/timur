export interface RelativeTime {
    direction: 'past' | 'present' | 'future',
    resolution: 'second' | 'minute' | 'hour' | 'day';
    value: number;
}

export function toRelativeTime(timestamp: number): RelativeTime {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff === 0) {
        return {
            direction: 'present',
            resolution: 'second',
            value: 0,
        };
    }

    const direction = diff < 0 ? 'future' : 'past';
    const absDiff = Math.abs(diff);

    const seconds = Math.floor((absDiff / 1000) % 60);
    const minutes = Math.floor((absDiff / (1000 * 60)) % 60);
    const hours = Math.floor((absDiff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

    if (days > 0) {
        return {
            direction,
            resolution: 'day',
            value: days,
        };
    }

    if (hours > 0) {
        return {
            direction,
            resolution: 'hour',
            value: hours,
        };
    }

    if (minutes > 0) {
        return {
            direction,
            resolution: 'minute',
            value: minutes,
        };
    }

    return {
        direction,
        resolution: 'second',
        value: Math.max(1, seconds),
    };
}

export function formatRelativeTimeToString(relativeTime: RelativeTime) {
    const {
        direction,
        resolution,
        value,
    } = relativeTime;

    if (direction === 'present') {
        return 'now';
    }

    if (direction === 'past') {
        return value === 1 ? `A ${resolution} ago` : `${value} ${resolution}s ago`;
    }

    return value === 1 ? `In a ${resolution}` : `In ${value} ${resolution}s`;
}
