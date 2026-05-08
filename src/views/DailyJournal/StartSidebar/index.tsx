import { useContext } from 'react';
import {
    RiCalendar2Line,
    RiSettingsLine,
    RiTerminalBoxLine,
} from 'react-icons/ri';

import Button from '#components/Button';
import Link from '#components/Link';
import MonthlyCalendar from '#components/MonthlyCalendar';
import DateContext from '#contexts/date';

import styles from './styles.module.css';

interface Props {
    selectedDate: string;
    setSelectedDate: (newDate: string) => void;
    calendarComponentRef?: React.MutableRefObject<{
        resetView: (year: number, month: number) => void;
    } | null>;
    onShortcutsClick: () => void;
}

function StartSidebar(props: Props) {
    const {
        calendarComponentRef,
        selectedDate,
        setSelectedDate,
        onShortcutsClick,
    } = props;

    const { year, month, fullDate } = useContext(DateContext);

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
            {selectedDate !== fullDate && (
                <Link
                    to="dailyJournal"
                    variant="tertiary"
                    title="Jump to today"
                    icons={<RiCalendar2Line />}
                >
                    Jump to today
                </Link>
            )}
            <div className={styles.bottomActions}>
                <Button
                    name={undefined}
                    className={styles.desktopOnly}
                    onClick={onShortcutsClick}
                    title="Show shortcuts"
                    variant="tertiary"
                    icons={<RiTerminalBoxLine />}
                >
                    Shortcuts
                </Button>
                <Link
                    to="settings"
                    title="Settings"
                    variant="tertiary"
                    icons={<RiSettingsLine />}
                >
                    Settings
                </Link>
            </div>
        </div>
    );
}

export default StartSidebar;
