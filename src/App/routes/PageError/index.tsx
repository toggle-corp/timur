import {
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    RiArrowDownSLine,
    RiArrowUpSLine,
    RiHome4Line,
    RiRefreshLine,
} from 'react-icons/ri';
import { useRouteError } from 'react-router-dom';

import Button from '#components/Button';
import Link from '#components/Link';

import styles from './styles.module.css';

function PageError() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorResponse = useRouteError() as unknown as any;

    useEffect(
        () => {
            // eslint-disable-next-line no-console
            console.error(errorResponse);
        },
        [errorResponse],
    );

    const [
        fullErrorVisible,
        setFullErrorVisible,
    ] = useState(import.meta.env.DEV);

    const handleReloadButtonClick = useCallback(
        () => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            window.location.reload(true);
        },
        [],
    );

    return (
        <div className={styles.pageError}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <h1 className={styles.heading}>
                        Looks like we ran into some issue!
                    </h1>
                    {!fullErrorVisible && (
                        <div className={styles.stack}>
                            {errorResponse?.error?.message
                                || errorResponse?.message
                                || 'Something unexpected happended!'}
                        </div>
                    )}
                    {fullErrorVisible && (
                        <div className={styles.stack}>
                            {errorResponse?.error?.stack
                                || errorResponse?.stack
                                || errorResponse?.error?.message
                                || errorResponse?.message
                                || 'Stack trace not available!'}
                        </div>
                    )}
                </div>
                <div>
                    See the developer console for more details.
                </div>
                <div className={styles.footer}>
                    <Button
                        type="button"
                        name={!fullErrorVisible}
                        variant="transparent"
                        onClick={setFullErrorVisible}
                        title="Toggle error detail"
                        actions={fullErrorVisible ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
                    >
                        {fullErrorVisible ? 'Hide details' : 'Show details'}
                    </Button>
                    <div className={styles.actions}>
                        {/* NOTE: using the anchor element as it will refresh the page */}
                        <Link
                            href="/"
                            external
                            icons={<RiHome4Line />}
                            variant="quaternary"
                        >
                            Go to homepage
                        </Link>
                        <Button
                            name={undefined}
                            title="Reload page"
                            onClick={handleReloadButtonClick}
                            icons={<RiRefreshLine />}
                        >
                            Reload
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PageError;
