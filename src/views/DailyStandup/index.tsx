import {
    useCallback,
    useMemo,
} from 'react';
import {
    IoChevronBack,
    IoChevronForward,
} from 'react-icons/io5';
import { useParams } from 'react-router-dom';
import {
    encodeDate,
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import Button from '#components/Button';
import DisplayPicture from '#components/DisplayPicture';
import Page from '#components/Page';
import {
    AllProjectsQuery,
    AllProjectsQueryVariables,
} from '#generated/types/graphql';
import useUrlQueryState from '#hooks/useUrlQueryState';

import EndSection from './EndSection';
import ProjectStandup from './ProjectStandup';

import styles from './styles.module.css';

const dateFormatter = new Intl.DateTimeFormat(
    [],
    {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
    },
);

function getFormattedDaysRemaining(numDays: number) {
    if (numDays === 0) {
        return 'Today';
    }

    if (numDays === 1) {
        return 'Tomorrow';
    }

    if (numDays === -1) {
        return 'Yesterday';
    }

    return numDays < 0 ? `${numDays} days ago` : `In ${numDays} days`;
}

const ALL_PROJECTS_QUERY = gql`
    query AllProjects {
        private {
            id
            allProjects {
                id
                name
                deadlines {
                    id
                    name
                    remainingDays
                    startDate
                    totalDays
                    usedDays
                    projectId
                }
                description
                logo {
                    url
                }
            }
        }
    }
`;

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const { date: dateFromParams } = useParams<{ date: string | undefined}>();

    const selectedDate = useMemo(() => {
        const today = new Date();

        if (isNotDefined(dateFromParams)) {
            return encodeDate(today);
        }

        const date = new Date(dateFromParams);

        if (Number.isNaN(date.getTime())) {
            return encodeDate(today);
        }

        return encodeDate(date);
    }, [dateFromParams]);

    const [allProjectsResponse] = useQuery<AllProjectsQuery, AllProjectsQueryVariables>({
        query: ALL_PROJECTS_QUERY,
    });

    type UrlQueryKey = 'project' | 'page';
    const [
        urlQuery,
        setUrlQuery,
    ] = useUrlQueryState<Record<UrlQueryKey, string | null | undefined>, UrlQueryKey>(
        ['project', 'page'],
        (value) => value,
        (value) => value,
    );

    const formattedDate = dateFormatter.format(new Date(selectedDate));

    const projectsMap = useMemo(() => {
        const allProjectsData = allProjectsResponse?.data?.private.allProjects;

        if (isNotDefined(allProjectsData)) {
            return undefined;
        }
        const initialMap: Record<string, Record<'next' | 'prev', string | undefined>> = {
            start: {
                prev: undefined,
                next: allProjectsData[0].id,
            },
            end: {
                prev: allProjectsData[allProjectsData.length - 1].id,
                next: undefined,
            },
        };

        return allProjectsData.reduce(
            (acc, val, index) => {
                const currentMap = {
                    next: index === (allProjectsData.length - 1) ? 'end' : allProjectsData[index + 1].id,
                    prev: index === 0 ? 'start' : allProjectsData[index - 1].id,
                };

                acc[val.id] = currentMap;

                return acc;
            },
            initialMap,
        );
    }, [allProjectsResponse?.data]);

    const updatePage = useCallback((pageId: string | undefined) => {
        if (pageId === 'start') {
            setUrlQuery({
                project: undefined,
                page: undefined,
            });
            return;
        }

        if (pageId === 'end') {
            setUrlQuery({
                project: undefined,
                page: 'end',
            });
            return;
        }

        setUrlQuery({
            project: pageId,
            page: undefined,
        });
    }, [setUrlQuery]);

    const mapId = urlQuery.page ?? urlQuery.project;
    const prevButtonName = isDefined(mapId) ? projectsMap?.[mapId]?.prev : undefined;
    const prevButtonDisabled = isNotDefined(mapId) || isNotDefined(projectsMap?.[mapId]?.prev);

    const nextButtonName = isDefined(mapId)
        ? projectsMap?.[mapId].next
        : projectsMap?.start.next;
    const nextButtonDisabled = isNotDefined(mapId)
        ? false
        : isNotDefined(projectsMap?.[mapId].next);

    return (
        <Page
            className={styles.dailyStandup}
            documentTitle="Timur - Daily Standup"
            contentClassName={styles.pageContent}
        >
            <div className={styles.content}>
                {isNotDefined(mapId) && (
                    <section className={styles.welcomeSection}>
                        <header className={styles.welcomeHeader}>
                            <div className={styles.welcomeLabel}>
                                Welcome to
                            </div>
                            <h2 className={styles.welcomeHeading}>
                                Daily Standup
                            </h2>
                            <div className={styles.date}>
                                {formattedDate}
                            </div>
                        </header>
                        <section className={styles.deadlineSection}>
                            <h3 className={styles.deadlineHeading}>
                                Upcoming Deadlines
                            </h3>
                            <div
                                className={styles.projectList}
                                role="list"
                            >
                                {allProjectsResponse.data?.private.allProjects.map((project) => {
                                    if (
                                        isNotDefined(project.deadlines)
                                        || project.deadlines.length === 0
                                    ) {
                                        return null;
                                    }

                                    return (
                                        <section
                                            key={project.id}
                                            role="listitem"
                                            className={styles.project}
                                        >
                                            <header className={styles.projectHeader}>
                                                <DisplayPicture
                                                    className={styles.projectDp}
                                                    imageUrl={project.logo?.url}
                                                    displayName={project.name}
                                                />
                                                <h4>
                                                    {project.name}
                                                </h4>
                                            </header>
                                            <div
                                                className={styles.deadlineList}
                                                role="list"
                                            >
                                                {project.deadlines.map((deadline) => (
                                                    <div
                                                        role="listitem"
                                                        key={deadline.id}
                                                        className={styles.deadline}
                                                    >
                                                        <div className={styles.dDay}>
                                                            {getFormattedDaysRemaining(
                                                                deadline.remainingDays,
                                                            )}
                                                        </div>
                                                        <div>
                                                            {deadline.name}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    );
                                })}
                            </div>
                        </section>
                    </section>
                )}
                {isNotDefined(urlQuery.page) && isDefined(urlQuery.project) && (
                    <ProjectStandup
                        className={styles.projectStandup}
                        date={selectedDate}
                        projectId={urlQuery.project}
                    />
                )}
                {urlQuery.page === 'end' && (
                    <EndSection
                        date={selectedDate}
                        className={styles.endSection}
                    />
                )}
            </div>
            <div className={styles.actions}>
                <Button
                    name={prevButtonName}
                    onClick={updatePage}
                    variant="secondary"
                    disabled={prevButtonDisabled}
                    icons={<IoChevronBack />}
                    title="Previous standup slide"
                >
                    Prev
                </Button>
                <Button
                    name={nextButtonName}
                    onClick={updatePage}
                    variant="secondary"
                    disabled={nextButtonDisabled}
                    actions={<IoChevronForward />}
                    title="Next standup slide"
                >
                    Next
                </Button>
            </div>
        </Page>
    );
}

Component.displayName = 'DailyStandup';
