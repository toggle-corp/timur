import {
    IoCheckboxOutline,
    IoCreateOutline,
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
                <IoCreateOutline className={className} />
            )}
            {value && !indeterminate && (
                <IoCheckboxOutline className={className} />
            )}
            {!value && !indeterminate && (
                <IoSquareOutline className={className} />
            )}
        </>
    );
}

export default Checkmark;
