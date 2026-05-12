import {
    Suspense,
    useContext,
    useDeferredValue,
    useMemo,
} from 'react';
import {
    RiSettingsLine,
    RiTerminalBoxLine,
} from 'react-icons/ri';

import Button from '#components/Button';
import Link from '#components/Link';
import MonthlyCalendar from '#components/MonthlyCalendar';
import DateContext from '#contexts/date';
import {
    type JournalLeaveTypeEnum,
    type JournalWorkFromHomeTypeEnum,
} from '#generated/types/graphql';
import useGoogleCalendar from '#hooks/useGoogleCalendar';
import useLocalStorage from '#hooks/useLocalStorage';
import { type WorkItem } from '#utils/types';

import DayEventChipsSection from './DayEventChipsSection';
import GoogleCalendarSection from './GoogleCalendarSection';

import styles from './styles.module.css';

interface Props {
    selectedDate: string;
    setSelectedDate: (newDate: string) => void;
    onWorkItemCreateFromCalendar: (override: Partial<WorkItem>) => void;
    calendarComponentRef?: React.RefObject<{
        resetView: (year: number, month: number) => void;
    } | null>;
    onShortcutsClick: () => void;
    dayWorkItems: WorkItem[];
    leaveType?: JournalLeaveTypeEnum | null;
    wfhType?: JournalWorkFromHomeTypeEnum | null;
    lastEditedAt: number | null;
}

function StartSidebar(props: Props) {
    const {
        calendarComponentRef,
        selectedDate,
        setSelectedDate,
        onShortcutsClick,
        onWorkItemCreateFromCalendar,
        dayWorkItems,
        leaveType,
        wfhType,
        lastEditedAt,
    } = props;

    const deferredSelectedDate = useDeferredValue(selectedDate);

    const { year, month } = useContext(DateContext);

    const [storedConfig] = useLocalStorage('timur-config');
    const { googleCalendarEnabled, showEvents } = storedConfig;

    const { isConnected: isGoogleCalendarConnected } = useGoogleCalendar();

    const googleEnabled = googleCalendarEnabled && isGoogleCalendarConnected;

    const addedDescriptions = useMemo(() => {
        const set = new Set<string>();
        dayWorkItems.forEach((item) => {
            if (item.description) {
                set.add(item.description.trim().toLowerCase());
            }
        });
        return set;
    }, [dayWorkItems]);

    return (
        <div className={styles.startSidebar}>
            <MonthlyCalendar
                componentRef={calendarComponentRef}
                selectedDate={selectedDate}
                initialYear={selectedDate ? new Date(selectedDate).getFullYear() : year}
                initialMonth={selectedDate ? new Date(selectedDate).getMonth() : month}
                onDateClick={setSelectedDate}
                lastEditedAt={lastEditedAt}
            />
            <Suspense fallback={null}>
                <DayEventChipsSection
                    loading={selectedDate !== deferredSelectedDate}
                    selectedDate={deferredSelectedDate}
                    showEvents={showEvents}
                    leaveType={leaveType}
                    wfhType={wfhType}
                    googleCalendarEnabled={googleEnabled}
                />
                {googleEnabled && (
                    <GoogleCalendarSection
                        loading={selectedDate !== deferredSelectedDate}
                        date={deferredSelectedDate}
                        addedDescriptions={addedDescriptions}
                        onWorkItemCreateFromCalendar={onWorkItemCreateFromCalendar}
                    />
                )}
            </Suspense>
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
