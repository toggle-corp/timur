import {
    useCallback,
    useEffect,
    useState,
} from 'react';
import { useRouteError } from 'react-router-dom';

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
    ] = useState(false);

    const handleErrorVisibleToggle = useCallback(
        () => {
            setFullErrorVisible((oldValue) => !oldValue);
        },
        [setFullErrorVisible],
    );

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
                    <div className={styles.message}>
                        {errorResponse?.error?.message
                            ?? errorResponse?.message
                            ?? 'Something unexpected happended!'}
                    </div>
                    <button
                        type="button"
                        name={undefined}
                        onClick={handleErrorVisibleToggle}
                    >
                        {fullErrorVisible ? 'Hide Error' : 'Show Error'}
                    </button>
                    {fullErrorVisible && (
                        <>
                            <div className={styles.stack}>
                                {errorResponse?.error?.stack
                                    ?? errorResponse?.stack ?? 'Stack trace not available!'}
                            </div>
                            <div className={styles.actions}>
                                See the developer console for more details.
                            </div>
                        </>
                    )}
                </div>
                <div className={styles.footer}>
                    {/* NOTE: using the anchor element as it will refresh the page */}
                    <Link
                        href="/"
                        external
                    >
                        Go back to homepage
                    </Link>
                    <button
                        type="button"
                        name={undefined}
                        onClick={handleReloadButtonClick}
                    >
                        Reload
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PageError;
