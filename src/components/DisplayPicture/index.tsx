import { useMemo } from 'react';
import {
    _cs,
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import styles from './styles.module.css';

interface Props {
    imageUrl: string | undefined | null;
    displayName: string;
    className?: string;
}

function stringToPastelColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
        // eslint-disable-next-line no-bitwise
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    const hue = hash % 360;
    return `hsl(${hue}, 60%, 45%)`;
}

function DisplayPicture(props: Props) {
    const {
        imageUrl,
        displayName,
        className,
    } = props;

    const color = useMemo(() => stringToPastelColor(displayName), [displayName]);

    return (
        <div
            className={_cs(styles.displayPicture, className)}
            style={isNotDefined(imageUrl) ? {
                backgroundColor: color,
            } : undefined}
        >
            {isDefined(imageUrl) ? (
                <img
                    className={styles.image}
                    src={imageUrl}
                    alt=""
                />
            ) : (
                <div className={styles.alt}>
                    {displayName.substring(0, 1)}
                </div>
            )}
        </div>
    );
}

export default DisplayPicture;
