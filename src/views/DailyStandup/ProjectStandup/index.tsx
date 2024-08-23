import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import DisplayPicture from '#components/DisplayPicture';
import {
    DailyStandupQuery,
    DailyStandupQueryVariables,
} from '#generated/types/graphql';

import styles from './styles.module.css';

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
                        logo {
                            url
                        }
                    }
                    users {
                        id
                        leave
                        workFromHome
                        displayPicture
                        displayName
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

    const [standup] = useQuery<DailyStandupQuery, DailyStandupQueryVariables>({
        query: DAILY_STANDUP_QUERY,
        variables: { date, projectId },
    });

    const stats = standup.data?.private.dailyStandup.projectStat;

    return (
        <div className={_cs(styles.projectStandup, className)}>
            <header className={styles.header}>
                {isDefined(stats?.project.logo) && (
                    <img
                        className={styles.logo}
                        alt=""
                        src={stats?.project.logo?.url}
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
                    {stats?.users.map((user) => (
                        <div
                            key={user.id}
                            role="listitem"
                            className={styles.user}
                        >
                            <DisplayPicture
                                className={styles.displayPicture}
                                imageUrl={user.displayPicture}
                                displayName={user.displayName}
                            />
                            <div>
                                {user.displayName}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ProjectStandup;
