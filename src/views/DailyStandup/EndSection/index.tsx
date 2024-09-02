import { _cs } from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import {
    DailyQuoteQuery,
    DailyQuoteQueryVariables,
} from '#generated/types/graphql';

import Slide from '../Slide';

import styles from './styles.module.css';

const DAILY_QUOTE_QUERY = gql`
    query DailyQuote($date: Date!) {
        private {
            id
            dailyStandup(date: $date) {
                quote {
                    id
                    text
                    author
                }
            }
        }
    }
`;

interface Props {
    date: string;
    className?: string;
}

function EndSection(props: Props) {
    const {
        date,
        className,
    } = props;

    const [quoteResponse] = useQuery<DailyQuoteQuery, DailyQuoteQueryVariables>({
        query: DAILY_QUOTE_QUERY,
        variables: { date },
    });

    const dailyQuote = quoteResponse.data?.private.dailyStandup.quote;

    return (
        <Slide
            className={_cs(styles.endSection, className)}
            variant="general"
        >
            <section className={styles.quoteSection}>
                <div className={styles.quote}>
                    {dailyQuote?.text}
                </div>
                <p className={styles.author}>
                    {dailyQuote?.author}
                </p>
            </section>
        </Slide>
    );
}

export default EndSection;
