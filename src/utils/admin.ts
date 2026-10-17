export function getAdminUrl(path: string) {
    return `${import.meta.env.APP_GRAPHQL_DOMAIN}/admin/${path}`;
}

// A person's records on one day, through the date range and user filters of the admin list
export function getAdminDayUrl(
    model: 'track/timeentry' | 'journal/journal',
    userId: string,
    date: string,
) {
    const search = new URLSearchParams({
        user: userId,
        date__range__gte: date,
        date__range__lte: date,
    });
    return getAdminUrl(`${model}/?${search.toString()}`);
}
