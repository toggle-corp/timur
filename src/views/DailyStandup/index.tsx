import {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    RiArrowLeftSLine,
    RiArrowRightSLine,
    RiFullscreenLine,
} from 'react-icons/ri';
import { useParams } from 'react-router-dom';
import {
    _cs,
    encodeDate,
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
import DateContext from '#contexts/date';
import NavbarContext from '#contexts/navbar';
import {
    AllProjectsQuery,
    AllProjectsQueryVariables,
} from '#generated/types/graphql';
import useKeybind from '#hooks/useKeybind';
import useUrlQueryState from '#hooks/useUrlQueryState';

import DeadlineSection from './DeadlineSection';
import EndSection from './EndSection';
import ProjectSection from './ProjectSection';
import StartSection from './StartSection';

import styles from './styles.module.css';

const ALL_PROJECTS = gql`
    query AllProjects {
        private {
            id
            allProjects {
                id
                name
                logoHd {
                    url
                }
            }
        }
    }
`;

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const { date: dateFromParams } = useParams<{ date: string | undefined}>();
    const { fullDate } = useContext(DateContext);

    const { midActionsRef } = useContext(NavbarContext);
    const contentRef = useRef<HTMLDivElement>(null);

    const selectedDate = useMemo(() => {
        if (isNotDefined(dateFromParams)) {
            return fullDate;
        }

        const date = new Date(dateFromParams);

        if (Number.isNaN(date.getTime())) {
            return fullDate;
        }

        return encodeDate(date);
    }, [dateFromParams, fullDate]);

    const [allProjectsResponse] = useQuery<
        AllProjectsQuery,
        AllProjectsQueryVariables
    >({
        query: ALL_PROJECTS,
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

    const projectsMap = useMemo(() => {
        const allProjectsData = allProjectsResponse?.data?.private.allProjects;

        if (isNotDefined(allProjectsData)) {
            return undefined;
        }

        const initialMap: Record<string, Record<'next' | 'prev', string | undefined>> = {
            start: {
                prev: undefined,
                next: 'deadlines',
            },
            deadlines: {
                prev: 'start',
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
                    prev: index === 0 ? 'deadlines' : allProjectsData[index - 1].id,
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

        if (pageId === 'deadlines') {
            setUrlQuery({
                project: undefined,
                page: 'deadlines',
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

    const mapId = urlQuery.page ?? urlQuery.project ?? 'start';
    const prevButtonName = projectsMap?.[mapId].prev;
    const prevButtonDisabled = isNotDefined(prevButtonName);

    const nextButtonName = projectsMap?.[mapId].next;
    const nextButtonDisabled = isNotDefined(nextButtonName);

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
                        <RiArrowLeftSLine />
                    </Button>
                    <Button
                        name={nextButtonName}
                        onClick={updatePage}
                        variant="quaternary"
                        disabled={nextButtonDisabled}
                        title="Next standup slide"
                    >
                        <RiArrowRightSLine />
                    </Button>
                    <Button
                        name={undefined}
                        onClick={handlePresentClick}
                        variant="quaternary"
                        title="Enter full screen"
                        icons={<RiFullscreenLine />}
                    >
                        Present
                    </Button>
                </div>
            </Portal>
            <div
                ref={contentRef}
                className={_cs(styles.content, isFullScreen && styles.presentationMode)}
            >
                {mapId === 'start' && (
                    <StartSection />
                )}
                {mapId === 'deadlines' && (
                    <DeadlineSection />
                )}
                {mapId !== 'start' && mapId !== 'end' && mapId !== 'deadlines' && (
                    <ProjectSection
                        date={selectedDate}
                        projectId={mapId}
                    />
                )}
                {mapId === 'end' && (
                    <EndSection
                        date={selectedDate}
                    />
                )}
            </div>
        </Page>
    );
}

Component.displayName = 'DailyStandup';
