import {
    useCallback,
    useContext,
    useMemo,
    useRef,
} from 'react';
import { FcHighPriority } from 'react-icons/fc';
import {
    IoChevronBack,
    IoChevronForward,
    IoExpandOutline,
} from 'react-icons/io5';
import { useParams } from 'react-router-dom';
import {
    compareNumber,
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
import Portal from '#components/Portal';
import NavbarContext from '#contexts/navbar';
import {
    AllProjectsQuery,
    AllProjectsQueryVariables,
} from '#generated/types/graphql';
import useKeybind from '#hooks/useKeybind';
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

    return numDays < 0
        ? `${numDays * -1} days ago`
        : `In ${numDays} days`;
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
                logoHd {
                    url
                }
            }
        }
    }
`;

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const { date: dateFromParams } = useParams<{ date: string | undefined}>();

    const { midActionsRef } = useContext(NavbarContext);
    const contentRef = useRef<HTMLDivElement>(null);

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
    const prevButtonName = isDefined(mapId)
        ? projectsMap?.[mapId]?.prev
        : undefined;
    const prevButtonDisabled = isNotDefined(mapId) || isNotDefined(projectsMap?.[mapId]?.prev);

    const nextButtonName = isDefined(mapId)
        ? projectsMap?.[mapId].next
        : projectsMap?.start.next;
    const nextButtonDisabled = isNotDefined(mapId)
        ? false
        : isNotDefined(projectsMap?.[mapId].next);

    const handleNextButtion = useCallback(
        () => {
            if (nextButtonDisabled) {
                return;
            }
            updatePage(nextButtonName);
        },
        [nextButtonName, nextButtonDisabled, updatePage],
    );
    const handlePrevButton = useCallback(
        () => {
            if (prevButtonDisabled) {
                return;
            }
            updatePage(prevButtonName);
        },
        [prevButtonName, prevButtonDisabled, updatePage],
    );

    const handleKeybindingsPress = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'ArrowRight' || event.key === 'PageDown') {
                event.preventDefault();
                event.stopPropagation();
                handleNextButtion();
            } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
                event.preventDefault();
                event.stopPropagation();
                handlePrevButton();
            }
        },
        [
            handleNextButtion,
            handlePrevButton,
        ],
    );

    const toggleFullScreen = async () => {
        const elem = contentRef.current;
        if (elem && !document.fullscreenElement) {
            try {
                await elem.requestFullscreen({ navigationUI: 'show' });
            } catch (err) {
                const castErr = err as { message: string, name: string };
                // eslint-disable-next-line no-alert
                alert(
                    `Error attempting to enable fullscreen mode: ${castErr.message} (${castErr.name})`,
                );
            }
        } else {
            document.exitFullscreen();
        }
    };

    useKeybind(handleKeybindingsPress);

    return (
        <Page
            className={styles.dailyStandup}
            documentTitle="Timur - Daily Standup"
            contentClassName={styles.pageContent}
            contentContainerClassName={styles.contentContainer}
        >
            <Portal container={midActionsRef}>
                <div className={styles.actions}>
                    <Button
                        name={prevButtonName}
                        onClick={updatePage}
                        variant="quaternary"
                        disabled={prevButtonDisabled}
                        title="Previous standup slide"
                    >
                        <IoChevronBack />
                    </Button>
                    <Button
                        name={nextButtonName}
                        onClick={updatePage}
                        variant="quaternary"
                        disabled={nextButtonDisabled}
                        title="Next standup slide"
                    >
                        <IoChevronForward />
                    </Button>
                    <Button
                        name={undefined}
                        onClick={toggleFullScreen}
                        variant="quaternary"
                        title="Enter full screen"
                    >
                        <IoExpandOutline />
                    </Button>
                </div>
            </Portal>
            <div
                className={styles.content}
                ref={contentRef}
            >
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
                            <hr className={styles.separator} />
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

                                    // FIXME: get this sorted from the server
                                    const sortedDeadlines = [...project.deadlines]
                                        .sort((foo, bar) => (
                                            compareNumber(foo.remainingDays, bar.remainingDays)
                                        ));

                                    return (
                                        <section
                                            key={project.id}
                                            role="listitem"
                                            className={styles.project}
                                        >
                                            <header className={styles.projectHeader}>
                                                <DisplayPicture
                                                    className={styles.projectDp}
                                                    imageUrl={project.logoHd?.url}
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
                                                {sortedDeadlines.map((deadline) => (
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
                                                            {deadline.remainingDays < 0 && (
                                                                <>
                                                                    {' '}
                                                                    <FcHighPriority />
                                                                </>
                                                            )}
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
        </Page>
    );
}

Component.displayName = 'DailyStandup';
