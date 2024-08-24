import {
    IoCheckbox,
    IoCreate,
    IoSquareOutline,
} from 'react-icons/io5';

export interface CheckmarkProps {
    className?: string;
    value: boolean | undefined | null;
    indeterminate?: boolean;
}

function Checkmark(props: CheckmarkProps) {
    const {
        className,
        indeterminate,
        value,
    } = props;

    return (
        <>
            {indeterminate && (
                <IoCreate className={className} />
            )}
            {value && !indeterminate && (
                <IoCheckbox className={className} />
            )}
            {!value && !indeterminate && (
                <IoSquareOutline className={className} />
            )}
        </>
    );
}

export default Checkmark;
