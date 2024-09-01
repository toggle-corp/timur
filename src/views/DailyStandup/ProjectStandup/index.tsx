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

import AvailabilityIndicator from '#components/AvailabilityIndicator';
import DisplayPicture from '#components/DisplayPicture';
import {
    DailyStandupQuery,
    DailyStandupQueryVariables,
    UserDepartmentTypeEnum,
} from '#generated/types/graphql';

import styles from './styles.module.css';

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
    date: string;
    className?: string;
}

const DAILY_STANDUP_QUERY = gql`
    query DailyStandup($date: Date!, $projectId: ID!) {
        private {
            id
            dailyStandup(date: $date) {
                projectStat(pk: $projectId) {
                    id
                    project {
                        id
                        name
                        description
                        deadlines {
                            id
                            name
                            startDate
                            totalDays
                            usedDays
                            remainingDays
                        }
                        logoHd {
                            url
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
                quote {
                    id
                    text
                    author
                }
            }
        }
    }
`;

function ProjectStandup(props: Props) {
    const {
        projectId,
        date,
        className,
    } = props;

    const [standupResponse] = useQuery<DailyStandupQuery, DailyStandupQueryVariables>({
        query: DAILY_STANDUP_QUERY,
        variables: { date, projectId },
    });

    const stats = standupResponse.data?.private.dailyStandup.projectStat;
    // FIXME: use memo
    const sortedUsers = [...(stats?.users ?? [])].sort((foo, bar) => (
        compareNumber(
            foo.user.department ? mapping[foo.user.department] : undefined,
            bar.user.department ? mapping[bar.user.department] : undefined,
        ) || compareString(
            foo.user.displayName,
            bar.user.displayName,
        )
    ));

    return (
        <div className={_cs(styles.projectStandup, className)}>
            <header className={styles.header}>
                {isDefined(stats?.project.logoHd) && (
                    <img
                        className={styles.logo}
                        alt=""
                        src={stats?.project.logoHd?.url}
                    />
                )}
                <h2 className={styles.projectName}>
                    {stats?.project.name}
                </h2>
            </header>
            <div className={styles.content}>
                <h3 className={styles.teamHeading}>
                    Team members
                </h3>
                <hr className={styles.separator} />
                <div
                    role="list"
                    className={styles.userList}
                >
                    {sortedUsers?.map((user) => (
                        <div
                            key={user.id}
                            role="listitem"
                            className={styles.user}
                        >
                            <DisplayPicture
                                className={styles.displayPicture}
                                imageUrl={user.user.displayPicture}
                                displayName={user.user.displayName ?? 'Anon'}
                            />
                            <div className={styles.name}>
                                {user.user.displayName ?? 'Anon'}
                                {' '}
                                <AvailabilityIndicator
                                    wfhType={user.workFromHome}
                                    leaveType={user.leave}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ProjectStandup;
