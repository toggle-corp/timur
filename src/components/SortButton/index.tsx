import {
    RiArrowDownSLine,
    RiArrowUpSLine,
} from 'react-icons/ri';
import { _cs } from '@togglecorp/fujs';

import Button from '#components/Button';
import { tooltipSurfaceClassName } from '#components/TooltipSurface';
import { visuallyHiddenClassName } from '#components/VisuallyHidden';

import styles from './styles.module.css';

export type SortDirection = 'asc' | 'desc';

export interface SortState<KEY> {
    key: KEY;
    direction: SortDirection;
}

// For the aria-sort of the column heading
// eslint-disable-next-line react-refresh/only-export-components
export function getAriaSort(active: boolean, direction: SortDirection) {
    if (!active) {
        return undefined;
    }
    return direction === 'asc' ? 'ascending' : 'descending';
}

// A second click flips the direction; another column starts in its own first direction
// eslint-disable-next-line react-refresh/only-export-components
export function getNextSort<KEY>(
    current: SortState<KEY>,
    key: KEY,
    firstDirection: SortDirection,
): SortState<KEY> {
    if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
    }
    return { key, direction: firstDirection };
}

// Leaves a leading abbreviation such as WFH as it is
function lowerFirst(text: string) {
    if (text.charAt(1) !== text.charAt(1).toLowerCase()) {
        return text;
    }
    return text.charAt(0).toLowerCase() + text.slice(1);
}

interface Props<KEY> {
    className?: string;
    name: KEY;
    label: string;
    // Read in place of a short label, and shown on keyboard focus
    description?: string;
    active: boolean;
    direction: SortDirection;
    onClick: (name: KEY) => void;
}

function SortButton<const KEY>(props: Props<KEY>) {
    const {
        className,
        name,
        label,
        description,
        active,
        direction,
        onClick,
    } = props;

    let icon;
    if (active) {
        icon = direction === 'asc' ? <RiArrowUpSLine /> : <RiArrowDownSLine />;
    }

    return (
        <>
            <Button
                className={_cs(styles.sortButton, className)}
                name={name}
                onClick={onClick}
                variant="transparent"
                title={`Sort by ${lowerFirst(description ?? label)}`}
                actions={icon}
            >
                {description ? (
                    <>
                        <span aria-hidden>{label}</span>
                        <span className={visuallyHiddenClassName}>{description}</span>
                    </>
                ) : label}
            </Button>
            {description && (
                <span
                    className={_cs(styles.tooltip, tooltipSurfaceClassName)}
                    aria-hidden
                >
                    {description}
                </span>
            )}
        </>
    );
}

export default SortButton;
