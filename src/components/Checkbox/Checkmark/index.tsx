import {
    RiCheckboxBlankLine,
    RiCheckboxFill,
    RiCheckboxIndeterminateFill,
} from 'react-icons/ri';

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
                <RiCheckboxIndeterminateFill className={className} />
            )}
            {value && !indeterminate && (
                <RiCheckboxFill className={className} />
            )}
            {!value && !indeterminate && (
                <RiCheckboxBlankLine className={className} />
            )}
        </>
    );
}

export default Checkmark;
