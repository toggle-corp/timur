import { _cs } from '@togglecorp/fujs';

import SlideCounter from '#components/SlideCounter';
import useCurrentDate from '#hooks/useCurrentDate';
import { formatDateTime } from '#utils/common';

import styles from './styles.module.css';

interface Props {
    className?: string;
    currentSlide: number | undefined;
    totalSlides: number | undefined;
}

function SlideFooter(props: Props) {
    const {
        className,
        currentSlide,
        totalSlides,
    } = props;

    const todayDate = useCurrentDate();

    return (
        <div className={_cs(styles.slideFooter, className)}>
            <span>{formatDateTime(todayDate)}</span>
            <SlideCounter
                current={currentSlide}
                total={totalSlides}
            />
        </div>
    );
}

export default SlideFooter;
