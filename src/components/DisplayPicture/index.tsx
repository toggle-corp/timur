import { useMemo } from 'react';
import {
    _cs,
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import stringToColor from 'string-to-color';

import styles from './styles.module.css';

interface Props {
    imageUrl: string | undefined | null;
    displayName: string;
    className?: string;
}

function DisplayPicture(props: Props) {
    const {
        imageUrl,
        displayName,
        className,
    } = props;

    const color = useMemo(() => stringToColor(displayName), [displayName]);

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
