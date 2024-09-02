import {
    Fragment,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    FcLandscape,
    FcLeave,
    FcNews,
    FcNightLandscape,
    FcSportsMode,
} from 'react-icons/fc';
import {
    IoChevronBack,
    IoChevronForward,
    IoExpandOutline,
} from 'react-icons/io5';
import { useParams } from 'react-router-dom';
import {
    _cs,
    compareDate,
    encodeDate,
    getDifferenceInDays,
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import Button from '#components/Button';
import Page from '#components/Page';
import Portal from '#components/Portal';
import NavbarContext from '#contexts/navbar';
import {
    AllProjectsAndEventsQuery,
    AllProjectsAndEventsQueryVariables,
} from '#generated/types/graphql';
import useKeybind from '#hooks/useKeybind';
import useUrlQueryState from '#hooks/useUrlQueryState';
import { type GeneralEvent } from '#utils/types';

import EndSection from './EndSection';
import GeneralEventOutput from './GeneralEvent';
import ProjectStandup from './ProjectStandup';
import Slide from './Slide';

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

const ALL_PROJECTS_AND_EVENTS_QUERY = gql`
    query AllProjectsAndEvents {
        private {
            id
            allProjects {
                id
                name
                deadlines {
                    id
                    name
                    remainingDays
                    endDate
                    totalDays
                    usedDays
                    projectId
                }
                description
                logoHd {
                    url
                }
            }
            relativeEvents {
                id
                name
                startDate
                typeDisplay
                dates
                endDate
                type
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

    const [allProjectsResponse] = useQuery<
        AllProjectsAndEventsQuery,
        AllProjectsAndEventsQueryVariables
    >({
        query: ALL_PROJECTS_AND_EVENTS_QUERY,
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

    useKeybind(handleKeybindingsPress);

    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        function fullscreenChangeHandler() {
            setIsFullScreen(isDefined(document.fullscreenElement));
        }

        document.addEventListener('fullscreenchange', fullscreenChangeHandler, false);

        return () => {
            document.removeEventListener('fullscreenchange', fullscreenChangeHandler, false);
        };
    }, []);

    const handlePresentClick = useCallback(() => {
        contentRef.current?.requestFullscreen();
    }, []);

    const events = useMemo<GeneralEvent[]>(() => {
        const allDeadlines = allProjectsResponse.data?.private.allProjects.flatMap(
            (project) => project.deadlines.map((deadline) => ({
                ...deadline,
                name: `${project.name}: ${deadline.name}`,
            })),
        );

        const otherEvents = allProjectsResponse.data?.private.relativeEvents;

        const iconsMap: Record<GeneralEvent['type'], React.ReactNode> = {
            DEADLINE: <FcLeave />,
            HOLIDAY: <FcLandscape />,
            RETREAT: <FcNightLandscape />,
            MISC: <FcNews />,
        };

        return [
            ...(allDeadlines?.map((deadline) => ({
                key: `DEADLINE-${deadline.id}`,
                type: 'DEADLINE' as const,
                typeDisplay: 'Deadline',
                icon: iconsMap.DEADLINE,
                name: deadline.name,
                date: deadline.endDate,
                remainingDays: deadline.remainingDays,
            })) ?? []),
            ...(otherEvents?.map((otherEvent) => ({
                key: `${otherEvent.type}-${otherEvent.id}`,
                type: otherEvent.type,
                icon: iconsMap[otherEvent.type],
                typeDisplay: otherEvent.typeDisplay,
                name: otherEvent.name,
                date: otherEvent.startDate,
                remainingDays: getDifferenceInDays(
                    otherEvent.startDate,
                    encodeDate(new Date()),
                ),
            })) ?? []),
        ].sort((a, b) => compareDate(a.date, b.date));
    }, [allProjectsResponse]);

    return (
        <Page
            className={styles.dailyStandup}
            documentTitle="Timur - Daily Standup"
            contentClassName={styles.pageContent}
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
                        onClick={handlePresentClick}
                        variant="quaternary"
                        title="Enter full screen"
                    >
                        <IoExpandOutline />
                    </Button>
                </div>
            </Portal>
            <div
                ref={contentRef}
                className={_cs(styles.content, isFullScreen && styles.presentationMode)}
            >
                {isNotDefined(mapId) && (
                    <Slide
                        variant="split"
                        primaryPreText="Welcome to"
                        primaryHeading="Daily Standup"
                        primaryDescription={formattedDate}
                        secondaryHeading="Upcoming Events"
                        secondaryContent={events.map(
                            (generalEvent, i) => (
                                <Fragment key={generalEvent.key}>
                                    <GeneralEventOutput
                                        generalEvent={generalEvent}
                                    />
                                    {generalEvent.remainingDays < 0
                                        && events[i + 1]?.remainingDays >= 0
                                        && (
                                            <div className={styles.separator}>
                                                <div className={styles.line} />
                                                <FcSportsMode className={styles.icon} />
                                                <div className={styles.line} />
                                            </div>
                                        )}
                                </Fragment>
                            ),
                        )}
                    />
                )}
                {isNotDefined(urlQuery.page) && isDefined(urlQuery.project) && (
                    <ProjectStandup
                        date={selectedDate}
                        projectId={urlQuery.project}
                    />
                )}
                {urlQuery.page === 'end' && (
                    <EndSection
                        date={selectedDate}
                    />
                )}
            </div>
        </Page>
    );
}

Component.displayName = 'DailyStandup';
