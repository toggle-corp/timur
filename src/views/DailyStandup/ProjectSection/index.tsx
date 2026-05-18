import {
    _cs,
    compareNumber,
    compareString,
    isDefined,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import DefaultMessage from '#components/DefaultMessage';
import SlideCounter from '#components/SlideCounter';
import UpcomingEventsList from '#components/UpcomingEventsList';
import UsersList from '#components/UsersList';
import {
    DailyStandupQuery,
    DailyStandupQueryVariables,
    UserDepartmentTypeEnum,
    AllProjectsQuery,
} from '#generated/types/graphql';
import useCurrentDate from '#hooks/useCurrentDate';
import { formatDateTime } from '#utils/common';

import Slide from '../Slide';

import styles from './styles.module.css';

type ProjectType = AllProjectsQuery['private']['allProjects'][number];

const mapping: {
    [key in UserDepartmentTypeEnum]: number;
} = {
    PROJECT_MANAGER: 1,
    DEVELOPMENT: 2,
    DESIGN: 3,
    QUALITY_ASSURANCE: 4,
    DATA_ANALYST: 5,
    MANAGEMENT: 6,
};

interface Props {
    projectId: string;
    project: ProjectType;
    date: string;
    className?: string;
    currentSlide: number | undefined;
    totalSlides: number | undefined;
}

const DAILY_STANDUP_QUERY = gql`
    query DailyStandup($date: Date!, $projectId: ID!) {
        private {
            id
            dailyStandup(date: $date) {
                id
                projectStat(pk: $projectId) {
                    id
                    project {
                        id
                        name
                        description
                        logoHd {
                            url
                        }
                        deadlines {
                            id
                            name
                            displayName
                            isExternal
                            remainingDays
                        }
                    }
                    users {
                        id
                        leave
                        workFromHome
                        user {
                            id
                            displayPicture
                            displayName
                            department
                        }
                    }
                }
            }
            relativeEvents {
                id
                name
                remainingDaysToStart
                typeDisplay
                type
            }
            contracts(
                pagination: { limit: 999 },
                filters: {
                    projectId: { exact: $projectId },
                    isArchived: { exact: false },
                },
            ) {
                items {
                    id
                    name
                }
            }
        }
    }
`;

function ProjectSection(props: Props) {
    const {
        projectId,
        project: projectFromProps,
        date,
        className,
        currentSlide,
        totalSlides,
    } = props;

    const [standupResponse] = useQuery<DailyStandupQuery, DailyStandupQueryVariables>({
        query: DAILY_STANDUP_QUERY,
        variables: { date, projectId },
        requestPolicy: 'cache-and-network',
    });

    const stats = standupResponse.data?.private.dailyStandup.projectStat;
    const project = stats?.project ?? projectFromProps;
    const deadlines = stats?.project?.deadlines;
    const events = standupResponse.data?.private.relativeEvents;
    const activeContracts = standupResponse.data?.private.contracts.items;
    const hasActiveContracts = (activeContracts?.length ?? 0) > 0;
    const hasUpcomingEvents = (deadlines?.length ?? 0) + (events?.length ?? 0) > 0;

    const todayDate = useCurrentDate();

    // FIXME: use memo
    const sortedUsers = [...(stats?.users ?? [])]
        .sort((foo, bar) => (
            compareNumber(
                foo.user.department ? mapping[foo.user.department] : undefined,
                bar.user.department ? mapping[bar.user.department] : undefined,
            ) || compareString(
                foo.user.displayName,
                bar.user.displayName,
            )
        ))
        .map((stat) => ({
            id: stat.id,
            displayPicture: stat.user.displayPicture,
            displayName: stat.user.displayName,
            leave: stat.leave,
            workFromHome: stat.workFromHome,
        }));

    return (
        <Slide
            variant="split"
            className={_cs(styles.projectSection, className)}
            primaryHeading={project.name}
            primaryDescription={project.description && (
                <p>
                    {project.description}
                </p>
            )}
            tertiaryContent={(
                <>
                    <div className={styles.subSections}>
                        {hasActiveContracts && (
                            <div className={styles.subSection}>
                                <h3 className={styles.subHeading}>
                                    Active Contracts
                                </h3>
                                <ul className={styles.contracts}>
                                    {activeContracts?.map((contract) => (
                                        <li key={contract.id}>
                                            {contract.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {hasUpcomingEvents && (
                            <div className={styles.subSection}>
                                <h3 className={styles.subHeading}>
                                    Deadlines & Events
                                </h3>
                                <UpcomingEventsList
                                    deadlines={deadlines}
                                    events={events}
                                />
                            </div>
                        )}
                    </div>
                    <div className={styles.currentTime}>
                        <span>{formatDateTime(todayDate)}</span>
                        <SlideCounter
                            current={currentSlide}
                            total={totalSlides}
                        />
                    </div>
                </>
            )}
            secondaryHeading="Team members"
            secondaryBackground={isDefined(project.logoHd)
                ? `url(${project.logoHd.url})`
                : undefined}
            secondaryContent={(
                <>
                    <UsersList
                        strikeoutForStandup
                        users={sortedUsers}
                    />
                    <DefaultMessage
                        filtered={false}
                        empty={sortedUsers.length === 0}
                        pending={standupResponse.fetching}
                        errored={!!standupResponse.error}
                        pendingMessage="Rounding up the team..."
                        errorMessage="Something went sideways!"
                        emptyMessage="No activity here!"
                    />
                </>
            )}
        />
    );
}

export default ProjectSection;
