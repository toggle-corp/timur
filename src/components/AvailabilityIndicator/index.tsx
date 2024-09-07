import {
    FcHome,
    FcLandscape,
    FcOrganization,
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

    const wfhContent = <FcHome title="Work from home" />;
    const leaveContent = <FcLandscape title="Leave" />;
    const officeContent = <FcOrganization title="Work" />;

    let firstContent;
    let secondContent;

    if (wfhType === 'FULL') {
        firstContent = wfhContent;
        secondContent = null;
    } else if (leaveType === 'FULL') {
        firstContent = leaveContent;
        secondContent = null;
    } else if (wfhType === 'FIRST_HALF' && leaveType === 'SECOND_HALF') {
        firstContent = wfhContent;
        secondContent = leaveContent;
    } else if (leaveType === 'FIRST_HALF' && wfhType === 'SECOND_HALF') {
        firstContent = leaveContent;
        secondContent = wfhContent;
    } else if (wfhType === 'FIRST_HALF') {
        firstContent = wfhContent;
        secondContent = officeContent;
    } else if (wfhType === 'SECOND_HALF') {
        firstContent = officeContent;
        secondContent = wfhContent;
    } else if (leaveType === 'FIRST_HALF') {
        firstContent = leaveContent;
        secondContent = officeContent;
    } else if (leaveType === 'SECOND_HALF') {
        firstContent = officeContent;
        secondContent = leaveContent;
    }

    return (
        <div className={_cs(styles.indicator, className)}>
            {firstContent}
            {secondContent}
        </div>
    );
}

export default AvailabilityIndicator;
