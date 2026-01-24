import { useContext } from 'react';

import MonthlyCalendar from '#components/MonthlyCalendar';
import DateContext from '#contexts/date';

import styles from './styles.module.css';

interface Props {
    selectedDate: string;
    setSelectedDate: (newDate: string) => void;
    calendarComponentRef?: React.MutableRefObject<{
        resetView: (year: number, month: number) => void;
    } | null>;
}

function StartSidebar(props: Props) {
    const {
        calendarComponentRef,
        selectedDate,
        setSelectedDate,
    } = props;

    const { year, month } = useContext(DateContext);

    return (
        <div
            className={styles.startSidebar}
        >
            <MonthlyCalendar
                componentRef={calendarComponentRef}
                selectedDate={selectedDate}
                initialYear={selectedDate ? new Date(selectedDate).getFullYear() : year}
                initialMonth={selectedDate ? new Date(selectedDate).getMonth() : month}
                onDateClick={setSelectedDate}
            />
        </div>
    );
}

export default StartSidebar;
