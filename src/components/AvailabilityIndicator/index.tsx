import {
    FcHome,
    FcLandscape,
} from 'react-icons/fc';
import { _cs } from '@togglecorp/fujs';

import {
    JournalLeaveTypeEnum,
    JournalWorkFromHomeTypeEnum,
} from '#generated/types/graphql';

import styles from './styles.module.css';

interface Props {
    className?: string;
    wfhType: JournalWorkFromHomeTypeEnum | null | undefined;
    leaveType: JournalLeaveTypeEnum | null | undefined;
    fallback?: React.ReactNode;
}

function AvailabilityIndicator(props: Props) {
    const {
        className,
        wfhType,
        leaveType,
        fallback,
    } = props;

    if (!wfhType && !leaveType) {
        // NOTE: We cannot return back React.ReactNode so wrapping with a
        // fragment for the time being
        // eslint-disable-next-line react/jsx-no-useless-fragment
        return <>{fallback}</>;
    }

    const wfhContent = !!wfhType && <FcHome title="Work from home" />;
    const leaveContent = !!leaveType && <FcLandscape title="Leave" />;

    let content = (
        <>
            {leaveContent}
            {wfhContent}
        </>
    );
    if (leaveType === 'SECOND_HALF') {
        content = (
            <>
                {wfhContent}
                {leaveContent}
            </>
        );
    }

    return (
        <div className={_cs(styles.indicator, className)}>
            {content}
        </div>
    );
}

export default AvailabilityIndicator;
