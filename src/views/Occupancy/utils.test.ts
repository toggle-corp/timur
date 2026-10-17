import {
    expect,
    test,
} from 'vitest';

import {
    buildOccupancyCsv,
    DEFAULT_SORT,
    getMonthDateRange,
    getProjectSummary,
    getTeamProjectFigures,
    sortOccupancyRows,
} from './utils';

const summary = {
    hours: 17.5,
    expectedHours: 24.5,
    occupancy: 0.71,
    leaveDays: 1.5,
    workFromHomeDays: 1.5,
    missingDays: 1,
    missingShare: 0.25,
    lateDays: 2,
    lateShare: 0.25,
    standupDays: 1,
    standupShare: 0.25,
    entries: 4,
    longEntries: 1,
    longEntryShare: 0.34,
    vagueEntries: 3,
    vagueEntryShare: 0.75,
    projectsPerDay: 1.5,
    topProject: { name: 'IFRC GO', share: 0.62 },
    projectCount: 3,
};

test('Month date range', () => {
    expect(getMonthDateRange('2026-09', '2026-10-13')).toEqual({
        startDate: '2026-09-01',
        endDate: '2026-09-30',
    });
    expect(getMonthDateRange('2024-02', '2026-10-13')).toEqual({
        startDate: '2024-02-01',
        endDate: '2024-02-29',
    });
    // The current month runs up to yesterday
    expect(getMonthDateRange('2026-10', '2026-10-13')).toEqual({
        startDate: '2026-10-01',
        endDate: '2026-10-12',
    });
    expect(getMonthDateRange('2026-10', '2026-10-01')).toBeUndefined();
});

test('Build occupancy csv', () => {
    const csv = buildOccupancyCsv(
        ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04'],
        [
            {
                name: 'Shrestha, "Ram"',
                days: [
                    { date: '2026-09-01', hours: 7, leave: null },
                    { date: '2026-09-02', hours: 1, leave: 'FULL' },
                    { date: '2026-09-03', hours: null, leave: 'FIRST_HALF' },
                    { date: '2026-09-04', hours: null, leave: 'FULL' },
                ],
                summary,
            },
            {
                name: 'Bina',
                days: [{ date: '2026-09-01', hours: 10.5 }],
                summary: {
                    ...summary,
                    occupancy: null,
                    ...getProjectSummary([], undefined),
                },
            },
        ],
    );
    expect(csv.split('\r\n')).toEqual([
        'Name,2026-09-01,2026-09-02,2026-09-03,2026-09-04,Hours logged,"Expected hours: 7h per working day, 3.5h on half leave",Occupancy: hours logged ÷ expected hours,"Leave days, with half days as 0.5",WFH days,"Missing days: days due without hours. Days due are working days, other than full leave, past their deadline.",Missing days as a share of days due,"Days logged late: days due whose first entry was created at or after 9:15 on the next working day, skipping full leave. Days without hours are missing, not logged late.","Days logged late as a share of days due: working days other than full leave, past their deadline","Days logged during the standup: days logged late whose first entry was created from 9:15 to 9:30 on the next working day, skipping full leave",Days logged during the standup as a share of days due,"Time entries with hours, other than TODO",Long entries: entries of 6h or more,Hours in long entries as a share of the hours logged,"Vague entries: entries with a description of one word or none, or of two words on entries of 2h or more",Vague entries as a share of the time entries with hours,"Project with the most hours other than Togglecorp, and its share of the hours outside Togglecorp. A share near 100% means one project only.","Projects per day with hours, other than Togglecorp. A high number means a lot of switching between projects.",Projects with hours logged',
        '"Shrestha, ""Ram""",7,Leave (1),,Leave,17.5,24.5,71,1.5,1.5,1,25,2,25,1,25,4,1,34,3,75,IFRC GO · 62%,1.5,3',
        'Bina,10.5,,,,17.5,24.5,,1.5,1.5,1,25,2,25,1,25,4,1,34,3,75,,1.5,0',
    ]);
});

test('Sort occupancy rows', () => {
    const rows = [
        { name: 'Bina', summary: { ...summary, hours: 10, occupancy: 0.5 } },
        {
            name: 'Asha',
            summary: {
                ...summary,
                hours: 20,
                occupancy: null,
                ...getProjectSummary([], undefined),
            },
        },
        {
            name: 'Chet',
            summary: {
                ...summary,
                hours: 10,
                occupancy: 0.9,
                topProject: { name: 'Helix', share: 1 },
            },
        },
    ];
    const names = (key: Parameters<typeof sortOccupancyRows>[1], direction: 'asc' | 'desc') => (
        sortOccupancyRows(rows, key, direction).map((row) => row.name)
    );

    // A to Z by default
    expect(names(DEFAULT_SORT.key, DEFAULT_SORT.direction)).toEqual(['Asha', 'Bina', 'Chet']);
    expect(names('name', 'asc')).toEqual(['Asha', 'Bina', 'Chet']);
    expect(names('name', 'desc')).toEqual(['Chet', 'Bina', 'Asha']);
    // Ties fall back to the name in both directions
    expect(names('hours', 'asc')).toEqual(['Bina', 'Chet', 'Asha']);
    expect(names('hours', 'desc')).toEqual(['Asha', 'Bina', 'Chet']);
    // Rows without a value stay last
    expect(names('occupancy', 'asc')).toEqual(['Bina', 'Chet', 'Asha']);
    expect(names('occupancy', 'desc')).toEqual(['Chet', 'Bina', 'Asha']);
    // Top projects by name
    expect(names('topProject', 'asc')).toEqual(['Chet', 'Bina', 'Asha']);
    expect(names('topProject', 'desc')).toEqual(['Bina', 'Chet', 'Asha']);
});

test('Team project figures', () => {
    const project = (id: string, name: string, hours: number) => ({ project: { id, name }, hours });
    const figures = getTeamProjectFigures(
        [
            { projects: [project('1', 'IFRC GO', 30), project('2', 'Helix', 10)] },
            { projects: [project('3', 'Mapswipe', 20), project('2', 'Helix', 15)] },
            { projects: [project('4', 'Alerthub', 5), project('5', 'Sahana', 4), project('6', 'Rodeo', 3)] },
        ],
        87,
    );
    // Hours add up across people, and only the top five show
    expect(figures.map((figure) => [figure.label, figure.value, figure.detail])).toEqual([
        ['IFRC GO', '34%', '30h'],
        ['Helix', '29%', '25h'],
        ['Mapswipe', '23%', '20h'],
        ['Alerthub', '6%', '5h'],
        ['Sahana', '5%', '4h'],
    ]);
});
